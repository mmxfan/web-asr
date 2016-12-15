#!/bin/bash

wavfile="speech.wav"
if [ -f $wavfile ]; then
        du -h $wavfile
else
	echo "No wav file!"
fi
