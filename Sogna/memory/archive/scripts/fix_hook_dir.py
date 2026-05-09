with open('Curator/engines/Sentinel/.husky/pre-commit', 'wb') as f:
    f.write(b'#!/bin/sh\n\n')
    f.write(b'echo "\\n\xf0\x9f\x9b\xa1\xef\xb8\x8f  [SOGNA] Sentinel Guardian is reviewing your changes..."\n')
    f.write(b'# Move to Sogna subdirectory where package.json is\n')
    f.write(b'cd Sogna\n')
    f.write(b'npm run sentinel:veto -- --staged\n')
