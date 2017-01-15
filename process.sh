#!/bin/bash

wavfile="speech.wav"
if [ -f $wavfile ]; then
        du -h $wavfile
else
	echo "$0 received: $1"
fi
