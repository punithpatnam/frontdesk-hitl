import os
import asyncio
import livekit.plugins.silero as silero
print("Silero module contents:", dir(silero))
from app.config import settings
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    function_tool,
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, silero

# Import your services
from app.services import kb_service
from app.repositories import help_requests_repo

# Map of active customer_id -> AgentSession so background tasks can notify the
# customer's session when a supervisor answer arrives.
active_sessions = {}

# Map help_request_id -> customer_id (in-memory) as a fallback if the Firestore
# document does not contain customer_id or uses a different key.
help_request_session_map = {}

# Map help_request_id -> Firestore listener handle so we can unsubscribe after resolution
help_request_listeners = {}

# Map help_request_id -> AgentSession (captured at escalation time) so listeners
# can target the exact session object instead of relying on global active_sessions
help_request_session_object = {}

# Small heuristic list of salon-related keywords to detect out-of-scope queries.
SALON_KEYWORDS = [
    'salon', 'hair', 'stylist', 'stylist', 'appointment', 'cut', 'colour', 'color',
    'shampoo', 'styling', 'barber', 'nail', 'spa', 'treatment', 'services',
    'pricing', 'price', 'hours', 'open', 'opening', 'booking', 'appointment', 'blow',
]


def is_relevant_to_salon(question: str) -> bool:
    """Return True if the question appears relevant to salon domain.

    Heuristic: true if KB has an exact match or the text contains one of the
    SALON_KEYWORDS. This keeps the agent from escalating/creating help requests
    for off-topic questions (movies, sports, etc.).
    """
    if not question:
        return False
    q = question.lower()
    # If KB already has a match, consider it relevant
    try:
        r = kb_service.smart_lookup(question)
        if r and r.get('found'):
            return True
    except Exception:
        # If KB lookup fails, fall through to keyword check
        pass
    for kw in SALON_KEYWORDS:
        if kw in q:
            return True
    return False


async def robust_say(s: 'AgentSession', msg: str, attempts: int = 3, base_delay: float = 0.2):
    """Safely speak via a session with basic state checks and retries.

    This function implements robust message delivery with exponential backoff
    to handle temporary connection issues and session state changes. It prevents
    attempts to send messages to disconnected sessions and provides retry logic
    for transient failures.
    """
    # Quick pre-check for common 'closed' indicators to avoid noisy retries
    try:
        # Print some useful session introspection for debugging
        is_active = getattr(s, 'is_active', None)
        closed = getattr(s, 'closed', None)
        _closed = getattr(s, '_closed', None)
        running = getattr(s, 'running', None)
        session_attrs = {
            'is_active': is_active,
            'closed': closed,
            '_closed': _closed,
            'running': running,
            'session_repr': repr(s)[:200]
        }
        print(f"[agent_bot][robust_say] session attrs: {session_attrs}")
        # If any indicator says closed/not running, skip speaking
        if is_active is False or closed is True or _closed is True or running is False:
            print(f" robust_say: session not active/closed; skipping speak: {repr(msg)[:120]}")
            return False
        # If all indicators are None, assume session is open and allow speaking
        # (LiveKit sometimes leaves these None at startup)
    except Exception as ex:
        print(f" robust_say: failed to introspect session state: {ex}")
        # If we can't introspect session state, continue with attempts below
        pass

    last_exc = None
    for i in range(attempts):
        try:
            await s.say(msg)
            print(f" robust_say succeeded: {repr(msg)[:120]}")
            return True
        except Exception as e:
            import traceback as _tb
            print(f" robust_say attempt {i+1} raised exception: {e}")
            _tb.print_exc()
            last_exc = e
            # If the session is explicitly not running, bail immediately
            msg_text = str(e)
            if 'AgentSession' in msg_text and 'not running' in msg_text or "isn't running" in msg_text:
                print(f" robust_say: session not running: {e}")
                return False
            try:
                await asyncio.sleep(base_delay * (2 ** i))
            except Exception:
                pass
    print(f" robust_say failed after {attempts} attempts: {last_exc}")
    return False

# Set environment variables
# Note: OPENAI_API_KEY should be set in your environment or .env file
if not os.getenv("OPENAI_API_KEY"):
    print("  Warning: OPENAI_API_KEY not found in environment variables")
    print("   Please set OPENAI_API_KEY in your .env file or environment")
    
os.environ["LIVEKIT_API_KEY"] = settings.LIVEKIT_API_KEY
os.environ["LIVEKIT_API_SECRET"] = settings.LIVEKIT_API_SECRET
os.environ["LIVEKIT_URL"] = settings.LIVEKIT_URL


@function_tool(description="Search the salon's knowledge base for answers to customer questions about services, hours, pricing, appointments, etc.")
async def search_knowledge_base(question: str) -> dict:
    """
    Search the salon's knowledge base for answers to customer questions.
    
    This function provides the primary interface for the AI agent to find
    answers to customer queries. It uses exact text matching for fast and
    reliable results, ensuring consistent responses for known questions.

    Args:
        question: The customer's question about salon services, hours, pricing, etc.

    Returns:
        dict: Contains 'found' (boolean), 'answer' (string), and 'confidence' (float) keys
    """
    # Use smart_lookup (exact matching only)
    result = kb_service.smart_lookup(question)
    try:
        print(f"[agent_bot] search_knowledge_base called with question: '{question}' -> result: {result}")
    except Exception:
        pass
    return result


@function_tool(name="answer_from_kb_or_escalate", description="Return an answer from the KB if available; otherwise escalate to a human supervisor. This tool MUST be used to produce any spoken answer to the customer.")
async def answer_from_kb_or_escalate(customer_id: str, question: str, session: 'AgentSession' = None) -> str:
    """Authoritative answer tool: returns KB answer if available, otherwise escalates."""
    # Special case: respond politely to greetings and thanks
    greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
    thanks = ["thank you", "thanks", "thx", "thankyou"]
    q_lower = question.strip().lower() if question else ""
    if any(greet in q_lower for greet in greetings):
        return "Hello! How can I help you today?"
    if any(thank in q_lower for thank in thanks):
        return "You're welcome! If you have any questions about our salon services, just ask."

    # First, try KB
    result = kb_service.smart_lookup(question)
    try:
        print(f"[agent_bot] answer_from_kb_or_escalate called with question: '{question}' -> kb_result: {result}")
    except Exception:
        pass

    if result and result.get("found"):
        # Return the KB answer as a plain string (agent will vocalize)
        answer_text = result.get("answer", "")
        return answer_text or "I'm sorry — I found a KB entry but it has no answer. I've sent this to a supervisor."

    # KB did not find an answer -> escalate
    # If the question appears out-of-scope, don't escalate — inform the user.
    try:
        if not is_relevant_to_salon(question):
            return "I'm sorry — I'm a salon assistant and that question looks outside my scope. I can help with salon services, pricing, hours, and appointments."
    except Exception:
        # If relevance check fails for any reason, fall back to escalation
        pass

    escalate_msg = await escalate_to_supervisor(customer_id=customer_id, question=question, session=session)
    # escalate_to_supervisor returns a string the agent can speak immediately
    return escalate_msg


@function_tool(description="Escalate a question to the human supervisor when you cannot find an answer in the knowledge base. This creates a pending help request that the supervisor will answer. The function will schedule background polling and return an immediate acknowledgement string the agent can speak.")
async def escalate_to_supervisor(customer_id: str, question: str, session: 'AgentSession' = None) -> str:
    """
    Escalate a question to the supervisor by creating a help request.
    The supervisor will answer this question, and their answer will be stored in the knowledge base.

    This function uses smart polling with exponential backoff for efficiency.
    If the supervisor answers during this time, the answer is returned immediately.

    Args:
        customer_id: The customer's identifier
        question: The question that needs supervisor help

    Returns:
        dict with 'help_request_id', 'status', 'answer', and 'message'
    """
    import asyncio
    from app.repositories.firestore_client import get_db
    
    print(f"Escalating to supervisor: {question}")
    # Inform caller to hold while escalating
    print("Please hold while I connect you to our supervisor for the answer.")
    
    try:
        # Create help request
        help_request_id = help_requests_repo.create_pending(customer_id, question)
        print(f" Created help request: {help_request_id}")
        try:
            help_request_session_map[help_request_id] = customer_id
            # Capture the session object if provided so the listener can speak
            # directly to it even if the global `active_sessions` map is reset
            if session is not None:
                try:
                    help_request_session_object[help_request_id] = session
                    try:
                        print(f"[agent_bot] captured session object for help_request {help_request_id}: {repr(session)[:200]}")
                    except Exception:
                        pass
                except Exception:
                    pass
        except Exception:
            pass

        # Try to register a Firestore on_snapshot listener for real-time updates.
        # If the environment/client doesn't support listeners, fall back to the
        # existing background polling strategy.
        from app.repositories.firestore_client import get_db as _get_db

        async def _handle_resolution_async(doc_dict, h_id: str):
            try:
                supervisor_answer = doc_dict.get("supervisor_answer", "")
                print(f" Supervisor answered (listener): {supervisor_answer}")
                # Upsert into KB
                kb_id = kb_service.upsert_supervisor_answer(question_raw=doc_dict.get("question"), answer=supervisor_answer)
                # Emit events
                from app.utils.events import emit_event as _emit
                _emit("help_request.resolved", {"resolver": doc_dict.get("resolver", ""), "answer": supervisor_answer, "kb_id": kb_id}, h_id)
                _emit("followup.sent", {"text": f"I checked with my supervisor: {supervisor_answer}"}, h_id)

                # If the customer is still connected, proactively speak the supervisor's answer.
                try:
                    doc_cust = doc_dict.get('customer_id')
                    chosen_cust = doc_cust or help_request_session_map.get(h_id) or customer_id
                    # Prefer the captured session object if we stored it at escalation time
                    sess = help_request_session_object.get(h_id) or active_sessions.get(chosen_cust)
                    print(f"[agent_bot] listener resolution: help_id={h_id}, doc_customer={doc_cust}, chosen_customer={chosen_cust}")
                    print(f"[agent_bot] active_sessions keys: {list(active_sessions.keys())}")
                    print(f"[agent_bot] help_request_session_object keys: {list(help_request_session_object.keys())}")
                    if sess is None:
                        print(f"[agent_bot] no active session for customer {chosen_cust}; skipping proactive speak")
                        # No active session — unsubscribe the listener immediately if present
                        try:
                            lst = help_request_listeners.pop(h_id, None)
                            if lst is not None:
                                try:
                                    lst.unsubscribe()
                                    print(f" Unsubscribed Firestore listener for help_request {h_id} (no active session)")
                                except Exception as ue:
                                    print(f" Failed to unsubscribe listener for {h_id}: {ue}")
                        except Exception:
                            pass
                    else:
                        question_text = doc_dict.get("question", "")
                        followup_text = f"Thanks for your patience. For your question: '{question_text}', the answer is: {supervisor_answer}"
                        try:
                            # Schedule the speak as a background task so we don't block
                            # the listener handler. Unsubscribe the listener after
                            # the speak task completes to ensure the TTS runs.
                            task = asyncio.create_task(robust_say(sess, followup_text))
                            print(f"[agent_bot] scheduled background robust_say for customer {chosen_cust}")
                            def _on_task_done(fut: 'asyncio.Future'):
                                try:
                                    exc = None
                                    try:
                                        exc = fut.exception()
                                    except Exception:
                                        exc = None
                                    if exc:
                                        print(f" robust_say task for help_request {h_id} raised: {exc}")
                                    # Unsubscribe listener now that the followup attempt finished
                                    try:
                                        lst = help_request_listeners.pop(h_id, None)
                                        if lst is not None:
                                            try:
                                                lst.unsubscribe()
                                                print(f" Unsubscribed Firestore listener for help_request {h_id} (after speak)")
                                            except Exception as ue:
                                                print(f" Failed to unsubscribe listener for {h_id}: {ue}")
                                    except Exception:
                                        pass
                                except Exception as e:
                                    print(f" error in robust_say done-callback: {e}")

                            try:
                                task.add_done_callback(_on_task_done)
                            except Exception as e:
                                print(f" Could not add done callback to robust_say task: {e}")
                        except Exception as e:
                            print(f" failed to schedule background robust_say: {e}")
                except Exception as e:
                    print(f" error while attempting proactive followup in listener: {e}")
            except Exception as e:
                print(f" error in handle_resolution_async: {e}")
                                    # Unsubscribe the Firestore listener for this help_request if we registered one
            try:
                lst = help_request_listeners.pop(h_id, None)
                if lst is not None:
                    try:
                        lst.unsubscribe()
                        print(f" Unsubscribed Firestore listener for help_request {h_id}")
                    except Exception as ue:
                        print(f" Failed to unsubscribe listener for {h_id}: {ue}")
            except Exception:
                pass
            # Also cleanup any captured session object for this help request
            try:
                help_request_session_object.pop(h_id, None)
            except Exception:
                pass

        # Build doc_ref and attempt to register listener
        try:
            db = _get_db()
            doc_ref = db.collection("help_requests").document(help_request_id)
            loop = asyncio.get_event_loop()

            def _on_snapshot(doc_snapshot, changes, read_time):
                try:
                    # doc_snapshot may be a DocumentSnapshot or a list of snapshots
                    ds = doc_snapshot
                    if isinstance(doc_snapshot, (list, tuple)) and len(doc_snapshot) > 0:
                        ds = doc_snapshot[0]
                    if ds is None:
                        return
                    docd = ds.to_dict() if hasattr(ds, 'to_dict') else None
                    if not docd:
                        return
                    if docd.get('status') == 'resolved':
                        # schedule the async resolution handler on the main loop
                        try:
                            loop.call_soon_threadsafe(asyncio.create_task, _handle_resolution_async(docd, help_request_id))
                        except Exception as sce:
                            print(f" failed to schedule resolution task from snapshot callback: {sce}")
                except Exception as e:
                    print(f" error in Firestore snapshot callback: {e}")

            listener = doc_ref.on_snapshot(_on_snapshot)
            try:
                help_request_listeners[help_request_id] = listener
            except Exception:
                pass
            print(f" Registered Firestore on_snapshot listener for help_request {help_request_id}")
        except Exception as e:
            print(f" Failed to register Firestore on_snapshot listener (falling back to polling): {e}")

            # Start background polling task so the agent can speak immediately
            async def _background_poll(help_id: str, cust_id: str, ques: str):
                try:
                    from app.repositories.firestore_client import get_db as _get_db
                    poll_intervals = [2, 3, 5, 8, 12, 20, 30]
                    max_total_time = settings.POLLING_TOTAL_TIMEOUT_SECONDS
                    start_time = asyncio.get_event_loop().time()

                    for i, interval in enumerate(poll_intervals[:settings.MAX_POLLING_ATTEMPTS]):
                        elapsed = asyncio.get_event_loop().time() - start_time
                        if elapsed >= max_total_time:
                            break
                        if interval > 0:
                            await asyncio.sleep(interval)

                        loop = asyncio.get_event_loop()
                        def _get_snapshot():
                            db = _get_db()
                            doc_ref = db.collection("help_requests").document(help_id)
                            return doc_ref.get()

                        snap = await loop.run_in_executor(None, _get_snapshot)
                        if snap.exists:
                            doc = snap.to_dict()
                            if doc.get("status") == "resolved":
                                supervisor_answer = doc.get("supervisor_answer", "")
                                print(f" Supervisor answered (background): {supervisor_answer}")
                                kb_id = kb_service.upsert_supervisor_answer(question_raw=doc["question"], answer=supervisor_answer)
                                from app.utils.events import emit_event as _emit
                                _emit("help_request.resolved", {"resolver": doc.get("resolver", ""), "answer": supervisor_answer, "kb_id": kb_id}, help_id)
                                _emit("followup.sent", {"text": f"I checked with my supervisor: {supervisor_answer}"}, help_id)
                                try:
                                    doc_cust = doc.get('customer_id')
                                    chosen_cust = doc_cust or help_request_session_map.get(help_id) or cust_id
                                    print(f"[agent_bot] background poll: help_id={help_id}, doc_customer={doc_cust}, chosen_customer={chosen_cust}")
                                    print(f"[agent_bot] active_sessions keys: {list(active_sessions.keys())}")
                                    sess = active_sessions.get(chosen_cust)
                                    if sess is None:
                                        print(f"[agent_bot] no active session for customer {chosen_cust}; skipping proactive speak")
                                    else:
                                        try:
                                            import asyncio as _asyncio
                                            print(f"[agent_bot] scheduling proactive followup task for customer {chosen_cust}")
                                            question_text = doc.get("question", "")
                                            followup_text = f"Thanks for your patience. For your question: '{question_text}', the answer is: {supervisor_answer}"
                                            _asyncio.get_event_loop().create_task(robust_say(sess, followup_text))
                                            print(f"[agent_bot] scheduled background robust_say for customer {chosen_cust}")
                                        except Exception as sch_err:
                                            print(f" failed to schedule proactive followup: {sch_err}")
                                except Exception as e:
                                    print(f" error while attempting proactive followup: {e}")
                                return
                    print(f" Background poll timeout for help_request {help_id}")
                except Exception as be:
                    print(f" Background poll error: {be}")

            try:
                asyncio.get_event_loop().create_task(_background_poll(help_request_id, customer_id, question))
            except Exception:
                asyncio.ensure_future(_background_poll(help_request_id, customer_id, question))

        # Return a simple string so the agent will vocalize it immediately
        return "I've sent your question to our supervisor. Please hold while I check with them and get back to you shortly."
    except Exception as e:
        print(f" Error creating help request: {e}")
        return "Error creating help request. Please try again."


async def entrypoint(ctx: JobContext):
    """Entry point for each LiveKit room connection"""
    
    print(f" Agent job received for room: {ctx.room.name}")
    print(f" Job ID: {ctx.job.id}")
    
    # --- Cleanup any stale session/help request mappings for this job/customer ---
    customer_id = f"{ctx.job.id}"
    # Remove any previous session for this customer
    if customer_id in active_sessions:
        try:
            del active_sessions[customer_id]
        except Exception:
            pass
    # Remove any help_request_session_object entries for this session
    stale_keys = [k for k, v in help_request_session_object.items() if v and hasattr(v, 'customer_id') and getattr(v, 'customer_id', None) == customer_id]
    for k in stale_keys:
        try:
            del help_request_session_object[k]
        except Exception:
            pass
    # Remove any help_request_session_map entries for this customer
    stale_map_keys = [k for k, v in help_request_session_map.items() if v == customer_id]
    for k in stale_map_keys:
        try:
            del help_request_session_map[k]
        except Exception:
            pass
    # Remove any listeners for this customer
    stale_listener_keys = [k for k, v in help_request_listeners.items() if k in stale_map_keys or k in stale_keys]
    for k in stale_listener_keys:
        try:
            lst = help_request_listeners.pop(k, None)
            if lst is not None:
                try:
                    lst.unsubscribe()
                except Exception:
                    pass
        except Exception:
            pass

    # Connect to the room with persistence across disconnects
    # Try multiple approaches based on SDK version and available APIs
    try:
        from livekit.rtc.room import RoomOptions, RoomConnectOptions
        options = RoomOptions()
        if hasattr(options, 'close_on_disconnect'):
            options.close_on_disconnect = False
        connect_opts = RoomConnectOptions()
        connect_opts.auto_subscribe = AutoSubscribe.AUDIO_ONLY
        connect_opts.options = options
        await ctx.connect(connect_opts)
        print(f" Connected with RoomConnectOptions (close_on_disconnect=False)")
    except Exception as e1:
        print(f" Could not use RoomConnectOptions: {e1}")
        try:
            options = RoomOptions()
            if hasattr(options, 'close_on_disconnect'):
                options.close_on_disconnect = False
            await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY, options=options)
            print(" Connected with RoomOptions (close_on_disconnect=False)")
        except Exception as e2:
            print(f" Could not use RoomOptions: {e2}")
            try:
                await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
                if hasattr(ctx.room, 'options') and hasattr(ctx.room.options, 'close_on_disconnect'):
                    ctx.room.options.close_on_disconnect = False
                    print(" Set close_on_disconnect=False on room.options")
                elif hasattr(ctx.room, 'close_on_disconnect'):
                    ctx.room.close_on_disconnect = False
                    print(" Set close_on_disconnect=False directly on room")
                print(f" Connected to room {ctx.room.name} with basic connect")
            except Exception as e3:
                print(f" Failed to set close_on_disconnect: {e3}")
                await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
                print(f" Connected to room {ctx.room.name} with fallback connect")
    
    # Extract customer ID from room participant (or use a default).
    # Use the job id to create a customer identifier that is unique per job
    # so help_request -> session mappings won't collide across reconnects.
    customer_id = f"{ctx.job.id}"
    # Log the assigned customer id for easier debugging in reconnect cases
    print(f"[agent_bot] assigned customer_id: {customer_id}")
    
    # Create the agent (only instructions and tools)
    agent = Agent(
        instructions=f"""You are a friendly and helpful voice assistant for a salon.

Your role is to answer customer questions about:

How to handle questions:
1. NEVER answer directly from your own knowledge. You MUST call the tool `answer_from_kb_or_escalate(customer_id, question)` to produce any spoken reply.
2. The `answer_from_kb_or_escalate` tool will return a KB answer if found, otherwise it will escalate to a human supervisor and return a hold message. Always use that tool.

Important guidelines:

Remember: Always use `answer_from_kb_or_escalate` — do not invent or hallucinate answers.
""",
    tools=[search_knowledge_base, escalate_to_supervisor, answer_from_kb_or_escalate],
    )

    # Create the session with voice pipeline configuration
    # Create the session WITHOUT an LLM so the agent will not hallucinate replies.
    # We will deterministically handle replies by listening for transcribed input and
    # calling `answer_from_kb_or_escalate` directly.
    # Pre-warm and configure STT/TTS/VAD for lower latency
    try:
        # Try to tune VAD if the API supports parameters
        vad = None
        try:
            vad = silero.VAD.load()
            # If VAD has configurable attributes, attempt to set them (best-effort)
            try:
                if hasattr(vad, 'threshold'):
                    vad.threshold = getattr(settings, 'SILERO_VAD_THRESHOLD', 0.3)
                if hasattr(vad, 'min_speech_duration_ms'):
                    vad.min_speech_duration_ms = getattr(settings, 'SILERO_MIN_SPEECH_MS', 200)
            except Exception:
                pass
        except Exception:
            # fallback: load default
            vad = silero.VAD.load()

        # Prewarm STT and TTS (best-effort)
        stt = openai.STT()
        tts = openai.TTS()
        try:
            # Some backends allow light-weight warm calls; ignore failures
            _ = stt  # referenced to imply warm-up
            _ = tts
        except Exception:
            pass

        session = AgentSession(
            vad=vad,
            stt=stt,
            llm=None,
            tts=tts,
        )
    except Exception as e:
        print(f"[agent_bot] Warning: prewarm/config failed: {e}")
        session = AgentSession(
            vad=silero.VAD.load(),
            stt=openai.STT(),
            llm=None,
            tts=openai.TTS(),
        )

    # Start the agent session
    await session.start(agent=agent, room=ctx.room)
    print(f" Agent session started (LLM disabled for deterministic replies)")
    # Register this session immediately so background tasks (supervisor followups)
    # can proactively speak to the customer if they are still connected. Register
    # early to reduce races where listeners resolve before the mapping exists.
    try:
        active_sessions[customer_id] = session
    except Exception:
        pass

    # Lightweight monitor task: poll a few session attributes and log transitions
    # to help diagnose unexpected quick session shutdowns that have been seen
    # in user logs (e.g. immediate job_shutdown/session closed events).
    monitor_task = None
    async def _monitor_session(sess: 'AgentSession', cust_id: str):
        prev = {'is_active': None, 'closed': None, '_closed': None}
        try:
            while True:
                try:
                    is_active = getattr(sess, 'is_active', None)
                    closed = getattr(sess, 'closed', None)
                    _closed = getattr(sess, '_closed', None)
                    if (is_active != prev['is_active'] or closed != prev['closed'] or _closed != prev['_closed']):
                        prev = {'is_active': is_active, 'closed': closed, '_closed': _closed}
                        print(f"[agent_bot][monitor] session {cust_id} attrs changed: {prev}")
                    # If session appears closed, break and let cleanup proceed
                    if is_active is False or closed is True or _closed is True:
                        print(f"[agent_bot][monitor] session {cust_id} detected closed state; exiting monitor")
                        break
                except Exception as e:
                    print(f"[agent_bot][monitor] error reading session attrs for {cust_id}: {e}")
                await asyncio.sleep(0.5)
        except asyncio.CancelledError:
            print(f"[agent_bot][monitor] cancelled for {cust_id}")
        except Exception as me:
            print(f"[agent_bot][monitor] unexpected error for {cust_id}: {me}")

    try:
        monitor_task = asyncio.get_event_loop().create_task(_monitor_session(session, customer_id))
    except Exception:
        try:
            monitor_task = asyncio.ensure_future(_monitor_session(session, customer_id))
        except Exception:
            monitor_task = None

    # Deterministic initial greeting (no LLM): speak immediately
    try:
            greet_text = "Hello — I'm your salon assistant. I will answer from the official knowledge base. If I don't know, I'll check with a supervisor."
            print(f"[agent_bot] attempting initial greeting: {greet_text}")
            # Inspect session prior to greeting
            try:
                print(f"[agent_bot] session before greeting: is_active={getattr(session,'is_active',None)}, closed={getattr(session,'closed',None)}, _closed={getattr(session,'_closed',None)}")
            except Exception as e:
                print(f"[agent_bot] failed to introspect session before greeting: {e}")
            res = await robust_say(session, greet_text)
            print(f"[agent_bot] greeting robust_say returned: {res}")
    except Exception:
        print(" session.say failed for greeting; continuing")

    # Register this session so background tasks (supervisor followups) can
    # proactively speak to the customer if they are still connected.
    try:
        active_sessions[customer_id] = session
    except Exception:
        pass

    # Ensure we remove the session and all related objects from active_sessions on exit
    async def _cleanup_session():
        try:
            if customer_id in active_sessions:
                del active_sessions[customer_id]
        except Exception:
            pass
        # Remove all help_request_session_object entries for this customer
        try:
            stale_keys = [k for k, v in help_request_session_object.items() if v and hasattr(v, 'customer_id') and getattr(v, 'customer_id', None) == customer_id]
            for k in stale_keys:
                try:
                    del help_request_session_object[k]
                except Exception:
                    pass
        except Exception:
            pass
        # Remove all listeners for this customer
        try:
            stale_map_keys = [k for k, v in help_request_session_map.items() if v == customer_id]
            stale_listener_keys = [k for k, v in help_request_listeners.items() if k in stale_map_keys or k in stale_keys]
            for k in stale_listener_keys:
                try:
                    lst = help_request_listeners.pop(k, None)
                    if lst is not None:
                        try:
                            lst.unsubscribe()
                        except Exception:
                            pass
                except Exception:
                    pass
        except Exception:
            pass
        # Cancel monitor task if it was started
        try:
            if monitor_task is not None:
                monitor_task.cancel()
                try:
                    await monitor_task
                except Exception:
                    pass
        except Exception:
            pass

    # Handler: called whenever the session receives a user transcript
    async def _on_transcript(evt):
        try:
            print(f"[agent_bot] DEBUG: Transcript handler called with event: {type(evt)}")
            # evt may be an object with attributes or a dict-like structure
            text = None
            if isinstance(evt, dict):
                text = evt.get("user_transcript") or evt.get("text") or evt.get("transcript")
                print(f"[agent_bot] DEBUG: Dict event, extracted text: {text}")
            else:
                text = getattr(evt, "user_transcript", None) or getattr(evt, "text", None) or getattr(evt, "transcript", None)
                print(f"[agent_bot] DEBUG: Object event, extracted text: {text}")

            if not text:
                print(f"[agent_bot] DEBUG: No text found in transcript event")
                return

            print(f"[agent_bot] Transcript event received: {text}")

            # Guard: skip if session is closing or not running
            try:
                is_active = getattr(session, 'is_active', None)
                closed = getattr(session, 'closed', None)
                _closed = getattr(session, '_closed', None)
                running = getattr(session, 'running', None)
                if is_active is False or closed is True or _closed is True or running is False:
                    print(f"[agent_bot] transcript handler: session is closed/not running, skipping reply")
                    return
                # If all indicators are None, assume session is open and allow reply
            except Exception as ex:
                print(f"[agent_bot] transcript handler: failed to introspect session state: {ex}")
                return

            # Call authoritative tool directly to avoid LLM hallucination
            print(f"[agent_bot] DEBUG: Calling answer_from_kb_or_escalate with question: '{text}'")
            reply = await answer_from_kb_or_escalate(customer_id=customer_id, question=text, session=session)
            print(f"[agent_bot] DEBUG: Got reply from answer_from_kb_or_escalate: '{reply}'")

            # Speak the authoritative reply deterministically (non-blocking)
            try:
                import asyncio as _asyncio
                # Use robust_say to handle transient session readiness races
                try:
                    print(f"[agent_bot] scheduling robust speak: {repr(reply)[:200]}")
                    _asyncio.get_event_loop().create_task(robust_say(session, reply))
                except Exception:
                    try:
                        _asyncio.ensure_future(robust_say(session, reply))
                    except Exception as se:
                        print(f" Failed to schedule robust speak task: {se}; reply was: {reply}")
            except Exception as se:
                print(f" session.say failed to schedule: {se}; reply was: {reply}")
        except Exception as e:
            print(f" Error in transcript handler: {e}")

    # The `.on()` API requires a synchronous callback. Provide a small
    # synchronous wrapper that schedules the async handler via
    # `asyncio.create_task`, so the async `_on_transcript` can run safely.
    import asyncio as _asyncio

    def _on_transcript_sync(evt):
        try:
            # schedule the async handler onto the running loop
            _asyncio.get_event_loop().create_task(_on_transcript(evt))
        except RuntimeError:
            # If there's no running loop in this thread, fall back to ensure_future
            try:
                _asyncio.ensure_future(_on_transcript(evt))
            except Exception as e:
                print(f"[agent_bot] Failed to schedule transcript handler: {e}")

    # Subscribe to transcript events using the synchronous wrapper
    try:
        session.on("UserInputTranscribedEvent", _on_transcript_sync)
        print("[agent_bot] subscribed to UserInputTranscribedEvent (sync wrapper)")
    except Exception as e:
        print(f"[agent_bot] could not subscribe to UserInputTranscribedEvent: {e}")
    try:
        session.on("user_input_transcribed", _on_transcript_sync)
        print("[agent_bot] subscribed to user_input_transcribed (sync wrapper)")
    except Exception as e:
        print(f"[agent_bot] could not subscribe to user_input_transcribed: {e}")

    # The session will now accept audio, we handle replies deterministically in the handler above.
    try:
        # Wait until the session finishes. The JobContext does not expose a
        # `wait_until_session_ended()` method in this environment, so use a
        # best-effort approach: prefer any session-provided awaitable, else
        # poll a couple session attributes, else wait for job cancellation.
        waited = False
        try:
            # Prefer common async helpers if available
            if hasattr(session, 'wait_closed') and callable(getattr(session, 'wait_closed')):
                await session.wait_closed()
                waited = True
        except Exception:
            pass

        try:
            if not waited and hasattr(session, 'join') and callable(getattr(session, 'join')):
                await session.join()
                waited = True
        except Exception:
            pass

        # Fallback: poll for a few attributes that may indicate active state
        if not waited:
            try:
                for _ in range(600):  # up to 60 seconds
                    # common patterns: is_active, closed, _closed
                    if getattr(session, 'is_active', None) is False:
                        break
                    if getattr(session, 'closed', None) is True:
                        break
                    if getattr(session, '_closed', None) is True:
                        break
                    await asyncio.sleep(0.1)
                waited = True
            except Exception:
                pass

        # Final fallback: wait until job context is cancelled or finishes
        if not waited:
            try:
                await ctx.job.wait()  # some environments expose job.wait()
            except Exception:
                # If that's not available, sleep until the process signals end
                await asyncio.sleep(0.1)
    finally:
        await _cleanup_session()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))