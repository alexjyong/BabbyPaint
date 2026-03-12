# BabbyPaint

<img width="350" height="1024" alt="image" src="https://github.com/user-attachments/assets/f0152406-ae6a-47fc-a831-62514749b682" />
<br/>

<img width="304" height="600" alt="screenshot-hello" src="https://github.com/user-attachments/assets/eb8a6f30-c13b-407d-b7a6-ea0451a1a84c" />

Simple little paint application for kids.
[<img src="https://f-droid.org/badge/get-it-on.png"
    alt="Get it on F-Droid"
    height="80">](https://f-droid.org/en/packages/dev.alexjyong.babbypaint/)
---

## Features

BabbyPaint is designed to be as simple as possible, perfect for little hands to start drawing without getting overwhelmed by options. It has a minimal interface with just the essentials: drawing, erasing, and a palette of fun colors. 

It even includes a handy "lock" button, preventing any accidental taps or swipes from leaving the app during creative time. 

No ads to distract your child, no in-app purchases, app doesn't steal your data, and is completely open-source and free!

You can download an apk file in the [releases section](https://github.com/alexjyong/BabbyPaint/releases).

You can also get the latest version in [F-Droid](https://f-droid.org/en/packages/dev.alexjyong.babbypaint/).

### Build It Yourself

If you're curious or want to make your own custom tweaks, you can build BabbyPaint yourself. Here's how you can get it running from source using Codespaces (or your preferred local environment):

1. If you are in codespaces, the environment set up will be done for you automatically through the devcontainer definition. [.devcontainer](.devcontainer/devcontainer.json)

Otherwise, you will need to install Node 24, and all dependencies.

```bash
cd app
npm install
npx cap sync android
```

2. Afterwards, you can run [build.sh](build.sh) to build your apk file.

Feel free to modify and play around with the source code to fit your needs! Whether you’re building this for your own kids or just curious about how it works, it’s easy to jump in and get started. 


# Acknowledgements


I got the idea to do this when I was trying to find a simple paint applcation for my young daughter's tablet and couldn't find an app that did exactly what I wanted. So I figured I could make my own!

Lock button feature inspired by [immersivelock.](https://github.com/babydots/immersivelock) by [Peter Serwylo](https://github.com/pserwylo).

Credit to [Lachlan Dawson](https://codepen.io/Lachlandawson) for the base code in this project from [here](https://codepen.io/Lachlandawson/pen/abmdyV). 

Credit to [Courtney Blazo](www.linkedin.com/in/courtney-b-12baa9182/) for the new logo for this app.
