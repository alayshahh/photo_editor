# Photo Editor

Im making a react app that runs natively on the browser (think photopea or gimp). 
The idea behind this was I wanted a simple way to add my most used edits to a photo anywhere at anytime. 
Most other editors are too complex, behind a paywall or just not what I want. 


## Features

### Halations
Im working on halations right now. I realize that ts/js is not the most performative framework for doing graphics work. Luckily solutions like web assembly and webGL exist. 

Halations are pretty simple: 
- i take all the brightest pixels based on the set threshold and create a binary mask
- i apply a gaussian blur for the halo effect on the binary mask
- i then color the mask pixels and overlay it on the image

How can I improve the speed?
I plan on splitting the halaiton process in those 3 steps. First, I will use wasm to loop over the image (cpu intensive) and generate my mask. This mask is now saved in my context. Mask regenerations are expensive purely because that means we need to compute the other 2 steps of the halation again. If not needed, we can just cache the mask in our context. Once we have a mask we need to compute the gaussian blur based on the blur radius provided. This is the most compute heavy part, we will use webGL. Then the simplest part (we can use wasm again)--color the pixels



## Disclaimer
I havent really made a react app and never used wasm / webGL. Hopefully this works