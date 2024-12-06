# BabbyPaint

<img width="242" alt="logo" src="https://github.com/user-attachments/assets/180a2ee3-9c03-4cf4-8b18-4b78cac6258d">
<img width="242" alt="lockexample" src="https://github.com/user-attachments/assets/b3e2af45-ee3a-43de-bd38-ddcd7650cdf2">

Simple little paint application for kids.
[<img src="https://f-droid.org/badge/get-it-on.png"
    alt="Get it on F-Droid"
    height="80">](https://f-droid.org/en/packages/dev.alexjyong.babbypaint/)
---

## Features

BabbyPaint is designed to be as simple as possible, perfect for little hands to start drawing without getting overwhelmed by options. It has a minimal interface with just the essentials: drawing, erasing, and a palette of fun colors. 

It even includes a handy "lock" button, preventing any accidental taps or swipes from leaving the app during creative time. 

No ads to distract your child, no in-app purchases, app doesn't steal your data, and is completely open-source and free!

You can download an apk file in the [releases section](https://github.com/alexjyong/BabbyPaint/releases). Google Play and F-Droid support coming soon!

### Build It Yourself

If you're curious or want to make your own custom tweaks, you can build BabbyPaint yourself. Here's how you can get it running from source using Codespaces (or your preferred local environment):

1. First, pull the custom Docker image:
    ```bash
    docker pull ghcr.io/alexjyong/babbypaint:main
    ```

2. Clone the repository and enter the project folder:
    ```bash
    git clone https://github.com/YOUR_USERNAME/babbypaint.git
    cd babbypaint
    ```

3. Now you're ready to prepare the environment and build the APK for Android:
    ```bash
    docker run --rm -i -v $PWD:/workspace -w /workspace --privileged ghcr.io/alexjyong/babbypaint:main sh -c "
            cd src &&
            cordova platform add android --verbose &&
            cordova plugin add cordova-plugin-x-toast &&
            cordova plugin add cordova-plugin-screen-pinning --verbose &&
            cordova build --verbose"
    ```

4. Once the build process finishes, you’ll have your APK ready in the `/src/platforms/android/app/build/outputs/apk/` directory.

Feel free to modify and play around with the source code to fit your needs! Whether you’re building this for your own kids or just curious about how it works, it’s easy to jump in and get started. 


# Acknowledgements


I got the idea to do this when I was trying to find a simple paint applcation for my young daughter's tablet and couldn't find an app that did exactly what I wanted. So I figured I could make my own!

Lock button feature inspiried by [immersivelock.](https://github.com/babydots/immersivelock) by [Peter Serwylo](https://github.com/pserwylo).

Credit to [Lachlan Dawson](https://codepen.io/Lachlandawson) for the base code in this project from [here](https://codepen.io/Lachlandawson/pen/abmdyV). 
