# WebThings Shell

A web app runtime for smart displays.

- [UI mockups](https://docs.google.com/presentation/d/e/2PACX-1vRuYf4dpo1D9kfjkraS8T5MEyy-1ZWmVOch-ts8anU10RAbDyNVDy0SPF00gk5Of16EBcAhPBV6Og-1/pub?start=false&loop=false&delayms=3000)


## Building & Running

To get started hacking on WebThings Shell first make sure that you have [Git](https://git-scm.com/) installed.

Clone the repository from GitHub:

```
$ git clone https://github.com/WebThingsIO/shell.git
$ cd shell
```

### Build for Linux desktop

To build for Linux desktop, first make sure that you have [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed.

We recommend using nvm to install the version of Node.js and npm listed in the .nvmrc file of this repository:

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
$ . ~/.bashrc
$ nvm install
$ nvm use
```

Install dependencies:
```
$ npm install
```

Start the application:
```
$ npm start
```

The shell should start up full screen.

## Packaging

### Package snap for current architecture

Make sure you have [snapcraft](https://snapcraft.io/snapcraft) installed.

```
$ snapcraft
```

### Package snap for other architectures
```
$ snapcraft remote-build
```

## Installing

### Install on Ubuntu Desktop

To install a self-built snap package on Ubuntu Desktop for testing:

- Install the ubuntu-frame and frame-it snaps to enable the application to access the display:

```
$ sudo snap install ubuntu-frame --channel=22
$ sudo snap install frame-it --classic
```

- Install the self-built WebThings Shell snap locally:

```
$ sudo snap install --dangerous webthings-shell_0.1.0_amd64.snap
```

- Configure the snap (needed to connect plugs whilst in development):

```
$ /snap/webthings-shell/current/bin/setup.sh
```

- Run the snap using frame-it:

```
$ frame-it webthings-shell
```

### Install on Ubuntu Core

To install a self-built snap package on Ubuntu Core:
- Follow the [instructions](https://ubuntu.com/download/raspberry-pi-core) to download, flash and configure Ubuntu Core on a Raspberry Pi and connect a display to the Pi
- Copy the built .snap package to the Raspberry Pi then SSH into it, using the IP address displayed on the screen and the username you assigned to your Ubuntu SSO account e.g.

```
$ scp webthings-shell_0.1.0_armhf.snap joebloggs@192.168.1.123:~/
$ ssh joebloggs@192.168.1.123
```

- Install the ubuntu-frame and avahi snaps on the device to enable access to the display and mDNS lookups:

```
$ snap install ubuntu-frame ubuntu-frame-osk avahi
```

- Install the webthings-shell snap:

```
$ snap install --dangerous webthings-shell_0.1.0_armhf.snap
```

- Run the snap:

```
$ sudo webthings-shell
```

The application should then start up full screen and load a http://gateway.local if accessible.