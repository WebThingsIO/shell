# WebThings Shell

WebThings Shell is a web app runtime for smart displays.

It can be used to create your own touch screen control panel to view and interact with web applications, e.g. the web interface of [WebThings Gateway](https://webthings.io/gateway/).

- [UI mockups](https://docs.google.com/presentation/d/e/2PACX-1vRuYf4dpo1D9kfjkraS8T5MEyy-1ZWmVOch-ts8anU10RAbDyNVDy0SPF00gk5Of16EBcAhPBV6Og-1/pub?start=false&loop=false&delayms=3000)

## Installation

### Install on Ubuntu Desktop

Install the ubuntu-frame and frame-it snaps to enable access to the display:

```
$ sudo snap install ubuntu-frame --channel=22
$ sudo snap install frame-it --classic
```

- Install the latest edge release of WebThings Shell:

```
$ sudo snap install --edge webthings-shell
```

- Configure the snap (needed while the snap is still in development):

```
$ /snap/webthings-snap/current/bin/setup.sh
```

- Run the snap using frame-it:

```
$ frame-it webthings-shell
```

The application should then start up full screen and load a WebThings Gateway web interface from http://gateway.local if available.

### Install on Ubuntu Core

To install the latest edge release of WebThings Shell on Ubuntu Core:
- Follow the [instructions](https://ubuntu.com/download/raspberry-pi-core) to download, flash and configure Ubuntu Core on a Raspberry Pi and connect a display to the Pi
- Install the ubuntu-frame and avahi snaps on the device to enable access to the display and mDNS lookups:

```
$ snap install ubuntu-frame ubuntu-frame-osk avahi
```

- Install the latest edge release of WebThings Shell:

```
$ snap install --edge webthings-shell
```

- Configure the snap (needed to connect plugs whilst in development):

```
$ /snap/webthings-shell/current/bin/setup.sh
```

- Run the snap:

```
$ sudo webthings-shell
```

The application should then start up full screen and load a WebThings Gateway web interface from http://gateway.local if available.


## Development

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

Or to run the application with developer tools enabled:

```
$ npm run develop
```

The application should then start up full screen and load a WebThings Gateway web interface from http://gateway.local if available.

## Packaging

Make sure you have [snapcraft](https://snapcraft.io/snapcraft) installed.

### Package snap for local architecture

```
$ snapcraft
```

### Package snap for other architectures

```
$ snapcraft remote-build
```

### Install a self-built snap

A self-built snap can be installed using the --dangerous flag, e.g.


```
$ sudo snap install --dangerous webthings-shell_0.1.0_amd64.snap
```