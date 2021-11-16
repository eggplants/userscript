#!/usr/bin/bash

if ! command -v awk curl >/dev/null; then
  exit 1
fi

curl -s https://greasyfork.org/en/users/671442-eggplants |
  awk -F\" '/class="script-link"/{
    c=split($4,f,"/");print$4"/code/"f[c]".user.js"}
  ' | xargs -n1 curl -OL
