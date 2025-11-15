# Notes On the Gaussian Blur 

## 11/12/25
I was really not happy with the current set up of the Gaussian blur for the halation. 

The things I do like:
- each step of the halation process is separated out so we don't ever need to do extra computing of the mask or blur if unneeded. 

The things I don't:
- WebGL is a bit foreign to me, and code is not something I've worked in enough to be happy with.
- I didn't fully understand gaussian blurs
- CPU -> GPU -> CPU to process a halation seems overkill. I think if we can just do it all in the CPU, it should still be fast, also lets me work in Rust, something I'm more familiar with. We can also avoid the copy to VRAM for the GPU and then copy back to RAM for the CPU.

As I was working on this I stumbled across another project called [photon](https://github.com/silvia-odwyer/photon/tree/master) which does something interesting. It uses box blurs to create a approximate gaussian blur, resulting in a more performative application.

This is interesting so I looked into this further. 

### Convolutions
So before I began, I realized I needed to build a better knowledge base of all this math. It seems simple enough look at surrounding pixels and use them to manipulate your value to get a blur effect. But I kept seeing the term _**convolution**_. I've heard of it in the context of CNNs, but looked into it more than that. 

$$ 
(f*g)(t) = \int^{\infty}_{-\infty} f(\tau)g(t-\tau) d\tau
$$
[Wikipedia](https://en.wikipedia.org/wiki/Convolution) says: In mathematics (in particular, functional analysis), convolution is a mathematical operation on two functions $f$ and $g$ that produces a third function $(f*g)$, as the integral of the product of the two functions after one is reflected about the y-axis and shifted.

This is where I'm thankful to the 3Blue1Brown youtube channel, the text definition of this was not very helpful.

https://www.youtube.com/watch?v=KuXjwB4LzSA (3B1B)
https://www.youtube.com/watch?v=8rrHTtUzyZA (Grant Sanderson MIT Lecture)
https://www.youtube.com/watch?v=9mLeVn8xzMw (FFT)
https://www.mathworks.com/help/images/fourier-transform.html (FFT)

Convolutions is a mathematical function that takes in 2 functions. In our case the first function is the image we work with, original data. the second function (also known as a kernel for image processing) is used to apply a function on the each pixel to get its resulting value. In our case the function would be the filter. In our case the negative of function likely does not matter as much since the gauss blur or the box blur will have the same weights on the neighboring pixels when flipped. Note that we do see is that for the gauss blur, as the blur radius would increase, the kernel increases in size resulting in more work. 

Something interesting from this, I see most of these fast algorithms use boxes to approximate gauss. Here Grant Sanderson mentions Fast Fourier Transforms instead of any convolution at all, saying these are a faster way to apply a convolution. I think he mentions that these happen in $O(n \log(n))$ where $n$ is the size of the image. But as we will see our boxes approximation is even faster happening in $O(n)$ time. FFTs seem pretty cool as well, they are actually used in image size compression! Maybe we find a way to incorporate this in the project.


### Approximating Gauss Blur with Boxes

A box blur you can do quite quickly. A gaussian blur is much harder given the size of the kernel. The idea is that the box convolution applied once is not great, but as you continue to apply it, it gets closer and closer to a gaussian approximation (kinda reminds me of a Taylor series from calc 2 where you continue to apply the same formula to get closer to the answer). In this case we don't necessarily need an exact gaussian blur, just something similar.

The first pass of the box blur will not look much like the gauss blur, since your convolution has equal weights all round. As you get to a second and third iteration of the box blur, you go from a  box to a tent blur to a quadratic blur. This becomes a very good approximation of the gauss blur! 

Why is that? 
This relies on the Central Limit Theorem and the properties of a convolution. Each convolution increases the number of independent variables that are used to determine the final pixel value. The CLT states that as you increase the number of independent variables, you will approach the gaussian distribution.
Initially, the box blur is uniform, so each pixel contributes equally to the final output resulting in a boxed filter. On the second pass, you are applying a box filter on a box filter, resulting in a triangle/tent shaped filter. On your third pass, you get a piecewise cubic filter, that looks pretty close to the gaussian filter. 


1 Pass (Box $\star$ Image): The kernel shape is a box.2 Passes (Box 4$\star$ Box 5$\star$ Image): The resulting kernel shape is a triangle (or triangular function).63 Passes (Box $\star$ Triangle $\star$ Image): The kernel shape is a smoother, bell-like curve that is an extremely close approximation of the Gaussian curve.


Here are the visuals from Wojciech Jarosz's ppt
![](Screenshot%202025-11-15%20at%202.11.28 PM.png)
![](Screenshot%202025-11-15%20at%202.13.59 PM.png)
![](Screenshot%202025-11-15%20at%202.14.07 PM.png)


Speed: 
The boxes algorithm is faster as it is independent of the blur radius. 
For the optimized 1D gaussian blur, with a radius $r$, we still perform $r$ operations per pixel because the kernel is a weighted average of each of the neighbors. You cannot easily use a sliding window since each of the values in the window need to be updated at each iteration!

For the box blur, you are given all equal weights so you can use a sliding window to compute the 1D kernel and this results in O(1) time per pixel after computing the initial kernel. 

So now we have a $O(n)$ time blur algorithm where n is the size of the image. This is better than $O(n*r)$ from the gauss blur.

An interesting thing to see, is that the FFT algorithm could be competitive with the blur algorithm while achieving a likely even more accurate gauss distribution, at only $O(n \log(n))$ time. 


Sources:
https://github.com/silvia-odwyer/photon/blob/master/crate/src/conv.rs#L188 
https://github.com/bfraboni/FastGaussianBlur
https://blog.ivank.net/fastest-gaussian-blur.html (PhotoPea guy who inspired this project!)
http://elynxsdk.free.fr/ext-docs/Blur/Fast_box_blur.pdf (The guy behind it all afaik)