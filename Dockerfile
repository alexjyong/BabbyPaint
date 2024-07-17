FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    TERM=xterm

# Install base packages and clean up
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y wget curl unzip gnupg2 lsb-release software-properties-common && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install OpenJDK 17
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk-headless && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    java -version

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Environment variables for Android SDK and build tools
ENV ANDROID_SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip" \
    ANDROID_BUILD_TOOLS_VERSION=34.0.0 \
    ANDROID_SDK_ROOT="/opt/android" \
    ANDROID_HOME="/opt/android"

ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/$ANDROID_BUILD_TOOLS_VERSION

# Install Android SDK
WORKDIR /opt
RUN mkdir -p android/cmdline-tools/latest && cd android && \
    wget -O tools.zip ${ANDROID_SDK_URL} && \
    unzip tools.zip -d temp-tools && \
    mv temp-tools/cmdline-tools/* cmdline-tools/latest/ && \
    rm -rf temp-tools tools.zip

RUN mkdir -p /root/.android && touch /root/.android/repositories.cfg && \
    yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
               "platforms;android-28" "platforms;android-29" "platforms;android-30" \
               "platforms;android-31" "platforms;android-32" "platforms;android-33" "platforms;android-34" \
               "extras;android;m2repository" "extras;google;google_play_services" "extras;google;instantapps" "extras;google;m2repository" \
               "add-ons;addon-google_apis-google-22" "add-ons;addon-google_apis-google-23" "add-ons;addon-google_apis-google-24"

RUN chmod a+x -R $ANDROID_SDK_ROOT && chown -R root:root $ANDROID_SDK_ROOT && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && apt-get autoremove -y && apt-get clean

# Install Node.js and Yarn
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn && \
    node -v && npm -v && yarn -v && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Cordova
ENV CORDOVA_VERSION=12.0.0

RUN npm install -g cordova@${CORDOVA_VERSION} && cordova -v

# Install Gradle
RUN wget https://services.gradle.org/distributions/gradle-8.7-bin.zip -P /tmp && \
    unzip -d /opt/gradle /tmp/gradle-8.7-bin.zip && \
    ln -s /opt/gradle/gradle-8.7/bin/gradle /usr/bin/gradle

ENV GRADLE_HOME=/opt/gradle/gradle-8.7
ENV PATH=$PATH:/opt/gradle/gradle-8.7/bin

WORKDIR /workspace

# This will allow you to exec into the container
CMD ["tail", "-f", "/dev/null"]
