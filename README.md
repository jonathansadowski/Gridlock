Changes Coming...
=========

Note: I'm in the process of modulizing this library and adding support for the Raspberry Pi (while similtaneously keeping support for the Beagle Bone).  The next version of Gridlock will have some breaking changes to the API, but asside from that, from a front-end prospective it should feel the same.  You should be able to use Gridlock in the mean time, however I would recommend only doing so if you have already purchased hardware.  The Raspberry Pi may turn out to be a better option for a project like this, both in terms of cost and ease of setup, but I don't want to recommend that anyone purchase it until I have a more mature version of the new code available.  Stay tuned.

Gridlock
=========

Gridlock is a Node.JS application for controlling a Traffic Light

  - Designed for the Beagle Bone
  - Includes a frontend with a live preview
  - API for changing state of light
  - Pusher support
  - Support for a hardware button to change light modes

Installation
--------------

NOTE: instructions assume that you are working on a Beagle Bone with both git and npm installed

1. `git clone http://github.com/jonathansadowski/Gridlock.git`
2. `cd Gridlock`
3. `npm install nconf express socket.io websocket-client`
4. `node app.js`

Running Gridlock as a Service
--------------

NOTE: You may have to change the installation path inside of the startup.sh script if you installed Gridlock in a directory other than /root/Gridlock

1. `npm install -g forever`
2. `mv startup.sh /etc/init.d/Gridlock`
3. `chmod 755 /etc/init.d/Gridlock`
4. `ln -s /etc/init.d/Gridlock /etc/rc5.d/S42Gridlock`


More Information
--------------
  - [Project Page]
  - [Beagle Bone]

Hardware
--------------
Gridlock and Beagle Bone will work with a vast array of hardware -- everything from simple LEDs to relays.  I am currently using a [SainSmart 4-Channel 5V Solid State Relay] attached to the GPIO pins of the [Beagle Bone].  I was previously using the [SainSmart 4-Channel 5V Relay], which is a great relay, but because its a physical relay, you will hear a clicking noise when the light changes, which can be annoying in any of the "blinking" modes.  I would recommend the solid state version. For more information about the hardware I use, see the [Project Page].

  [Project Page]: http://jonathansadowski.com/projects/Gridlock
  [Beagle Bone]: http://amzn.to/beaglebone
  [SainSmart 4-Channel 5V Relay]: http://amzn.to/5VRelay
  [SainSmart 4-Channel 5V Solid State Relay]: http://amzn.to/5VSSRelay
  


