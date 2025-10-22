try:
    import livekit
    print('LIVEKIT OK', getattr(livekit, '__version__', 'no-version-attr'))
    print('Has AccessToken:', hasattr(livekit, 'AccessToken'))
    print('Has VideoGrants:', hasattr(livekit, 'VideoGrants'))
except Exception as e:
    print('IMPORT ERROR:', e)
