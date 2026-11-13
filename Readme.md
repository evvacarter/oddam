# ODDAM // Kerala famous boat game 

oddam is a fast speed 2d boat racing game built with html css and javascript only no external assets and library are used .

this project is inspired by vallam kali that is kerelas traditionals snake boat race during the onam festival . in the south , snake boat racing have masive hype , boat moving in sync and chenda drum and many other things 

I wanted to capture that race that high speed energy in a browser game withour using heavy game engine or external library/image or audio assets.
every thing is hardcoded with my own research of 50 days 

## why i build this

when i first started working on oddam , my original plan was to make a rhytm-tapping game where you press tah spacebar on beat to row the boat faster .

but it should be hard to play to all of you that why i decided to make it simple 

so i prototyped that first, and honestly it felt super intresting now i play it after every 15 minuts 

instead of clicking the boat the boat accelerate automatically.

in every 3 sec the speed increased by +7 km/h with  with no maximum or highest speed cap earlier i had it capped around 135km/h, that dosent challenging so i removed the limit .

you can side kick other boats into the canal to knock them out .
if you touch a floating black mine is and instant out.

## features .. 

i didn't want the game to lag or wait for mp3 and .png files to load, so everything in this repo is rendered procedurally in code
100% canvas drawn the snake boat drawn using QuadraticCurve 

instead of downloading the sound effects, I wrote 3 small sound using AudioContext
these are playDrum(), playRamSound() and PlayBlastSound() 

At first, I tried Making a Soft rounded glassmorphissm Ui with blurred card but it looked way too generic so i completely change the stylesheet to use border radius to 0px and with some other changes like with bungee and chakra petch fonts 

## controls 

press A / D for move boat left and right 
press spacebar to quick start / restart after crashing 

## how to run it locally 

No extra things required 
just clone the repo 
```bash
git clone [https://github.com/evvacarter/oddam.git]
(https://github.com/evvacarter/oddam.git)
```
then open index.html file that will present in root then run directly in your browser or use the live server externsion in vs code 

## bugs that i fixed while building 

building this from scratch came with some pretty funny and a lot of frustating bugs: 
well after a lot of work its fianlly done 
made by Evva 