##Simple Clock Widget
ZERO dependency.
This lib allows you to add simple clock widget to your app.

### Features
- Simple clock
- Draggable clock
- Countdown mode
- Speed configuration

### Configs
To add clock to yor app run ClockWidget with prefered options:
- countdown: false, // countdown mode - **{boolean}**
- draggable: false, // make clock draggable - **{boolean}**
- hMirrored: false, // horizontal mirrored clock - **{boolean}**
- vMirrored: false, // vertical mirorred clock - **{boolean}**
- date: new Date("December 17, 1995 03:24:00"), // start from Date - **{DATE}**, by default new Date()
- lowBattery: false, // just for fun - **{boolean}**
- size: 277,  // size of clock, one of **['small', 'medium', large']** or **custom number**
- speed: 1 // speed of each tick **{Number}**

### Manual
#### Initialization
###### Example
```javascript
	const clock = ClockWidget({
		countdown: false, // countdown mode
		draggable: false, // make clock draggable
		hMirrored: false,
		vMirrored: false,
		date: new Date("December 17, 1995 03:24:00"),
		lowBattery: false,
		size: 277,
		speed: 1
	});
```
#### Pause/Resume
###### Example
```javascript
	clock.pause();
	closk.resume();
```

#### Overriding configs
###### Example
```javascript
	clock.updateClock({
		speed: 300,
		draggable: true,
		size: 'large'
	});
```