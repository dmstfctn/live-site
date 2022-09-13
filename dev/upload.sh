#!/usr/bin/env bash
now=$(date)
echo "BUILDING FOR UPLOAD"
node build.js upload
echo "COMMITTING BUILD"
git add -A
git commit -am "live build: $now"
echo "PUSHING TO GANDI"
git push gandi newlive
echo "PUTTING SITE LIVE"
ssh 1451555@git.dc2.gpaas.net deploy demystification.co.git newlive
echo "SWITCHING TO MASTER BRANCH"
git checkout master