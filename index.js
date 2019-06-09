(function () {
  "use strict";

  const svgns = "http://www.w3.org/2000/svg";
  const HANDS = [
    {name: "clockwidget-h-hand", x1: 50, y1: 50, x2: 50, y2: 24},
    {name: "clockwidget-m-hand", x1: 50, y1: 50, x2: 50, y2: 20},
    {name: "clockwidget-s-hand", x1: 50, y1: 50, x2: 50, y2: 16}
  ]
  const NUMBERS = [
    {number: 12, x: 50, y: 18},
    {number: 3, x: 85, y: 53},
    {number: 6, x: 50, y: 88},
    {number: 9, x: 15, y: 53}
  ]
  const TICKS = [
    {x1: 50, y1: 5.000, x2: 50.00, y2: 10.00},
    {x1: 72.50, y1: 11.03, x2: 70.00, y2: 15.36},
    {x1: 88.97, y1: 27.50, x2: 84.64, y2: 30.00},
    {x1: 95.00, y1: 50.00, x2: 90.00, y2: 50.00},
    {x1: 88.97, y1: 72.50, x2: 84.64, y2: 70.00},
    {x1: 72.50, y1: 88.97, x2: 70.00, y2: 84.64},
    {x1: 50.00, y1: 95.00, x2: 50.00, y2: 90.00},
    {x1: 27.50, y1: 88.97, x2: 30.00, y2: 84.64},
    {x1: 11.03, y1: 72.50, x2: 15.36, y2: 70.00},
    {x1: 5.000, y1: 50.00, x2: 10.00, y2: 50.00},
    {x1: 11.03, y1: 27.50, x2: 15.36, y2: 30.00},
    {x1: 27.50, y1: 11.03, x2: 30.00, y2: 15.36}
  ]
  const SMALL_SIZE = "small";
  const MEDIUM_SIZE = "medium";
  const LARGE_SIZE = "large";
  const SIZES = {
    [SMALL_SIZE]: 100,
    [MEDIUM_SIZE]: 200,
    [LARGE_SIZE]: 300
  }

  /**
   * Same as setInterval but with "pause"/"resume" features
   * @param {function} callback
   * @param {number} interval - ms
   * @returns {object} with "pause" and "resume" functions
   */
  function InvervalTimer(callback, _interval) {
    var interval = _interval
    var timerId, startTime, remaining = 0;
    var state = 0; //  0 = idle, 1 = running, 2 = paused, 3 = resumed

    this.pause = () => {
        if (state != 1) return;

        remaining = interval - (new Date() - startTime);
        clearInterval(timerId);
        state = 2;
    };
    this.resume = () => {
        if (state != 2) return;

        state = 3;
        setTimeout(this.timeoutCallback, remaining);
    };
    this.timeoutCallback = () => {
        if (state != 3) return;

        callback();

        startTime = new Date();
        timerId = setInterval(callback, interval);
        state = 1;
    };
    this.updateInterval = newInterval => {
      interval = newInterval;
      this.pause();
      this.resume();
    }

    startTime = new Date();
    timerId = setInterval(callback, interval);
    state = 1;
  }

  /**
   * @param {object} opts - widget options
   * @param {boolean} opts.countdown - countdown time
   * @param {boolean} opts.draggable - clock is draggable
   * @param {boolean} opts.hMirrored - :) just for fun (horizontal mirrored)
   * @param {boolean} opts.soundOn - tick with sound https://marcgg.com/blog/2016/11/01/javascript-audio/ https://medium.com/@soffritti.pierfrancesco/sound-generation-with-javascript-57b2fda65608
   * @param {boolean} opts.vMirrored - :) just for fun (vertical mirrored)
   * @param {Date} opts.date - start from certain Date
   * @param {string} opts.lowBattery - :) just for fun
   * @param {string} opts.size - small / medium / large / custom number
   * @param {string} opts.speed - 1 / 2 / 3 / ... / 500 / n
   * @example 
   * | ClockWidget({
   * |  draggable: true,
   * |  size: 244,
   * |  soundOn: true,
   * |  date: new Date("December 17, 1995 03:24:00")
   * | });
   */
  function ClockWidget (opts) {
    const applyOptions = () => Object.keys(this.opts).forEach(key => { this[key] = this.opts[key]; })

    this.opts = {
      countdown: false,
      draggable: false,
      hMirrored: false,
      lowBattery: false,
      size: 'medium',
      soundOn: false,
      speed: 1,
      vMirrored: false,
    }
    Object.assign(this.opts, opts)

    this.date = opts.date instanceof Date ? opts.date : new Date();
    this.tickCount = 0;
    this.dragListeners = [];
    applyOptions();

    const drawClock = () => {
      const clockContainer = document.createElement("div");
      clockContainer.setAttribute("id", "clockwidget-wrapper");

      const clock = document.createElementNS(svgns, "svg");
      const circle = document.createElementNS(svgns, "circle");

      const clockSize = typeof this.size === "number" ? this.size : SIZES[this.size]

      clock.setAttributeNS(null, "id", "clockwidget");    
      clock.setAttributeNS(null, "viewBox", "0 0 100 100");
      setSize(clockSize, clock);

      circle.setAttributeNS(null, "id", "clockwidget-circle");
      circle.setAttributeNS(null, "cx", "50");
      circle.setAttributeNS(null, "cy", "50");
      circle.setAttributeNS(null, "r", "45");

      // Draw numbers
      const numbersSVG = document.createElementNS(svgns, "g");
      numbersSVG.setAttributeNS(null, "id", "clockwidget-numbers");

      for (const num of NUMBERS) {
        let numberSVG = document.createElementNS(svgns, "text");
        numberSVG.setAttributeNS(null, "x", num.x);
        numberSVG.setAttributeNS(null, "y", num.y);

        let textNode = document.createTextNode(num.number);
        numberSVG.appendChild(textNode);
        numbersSVG.appendChild(numberSVG) 
      }
      //

      // Draw hands
      const handsSVG = document.createElementNS(svgns, "g");
      handsSVG.setAttributeNS(null, "id", "hands");

      for (const hand of HANDS) {
        let handSVG = document.createElementNS(svgns, "line");
        handSVG.setAttributeNS(null, "id", hand.name);
        handSVG.setAttributeNS(null, "x1", hand.x1);
        handSVG.setAttributeNS(null, "x2", hand.x2);
        handSVG.setAttributeNS(null, "y1", hand.y1);
        handSVG.setAttributeNS(null, "y2", hand.y2);
        handsSVG.appendChild(handSVG) 
      }
      //

      // Draw ticks
      const ticksSVG = document.createElementNS(svgns, "g");
      ticksSVG.setAttributeNS(null, "id", "ticks");
 
      for (const tick of TICKS) {
        let tickSVG = document.createElementNS(svgns, "line");
        tickSVG.setAttributeNS(null, "x1", tick.x1);
        tickSVG.setAttributeNS(null, "x2", tick.x2);
        tickSVG.setAttributeNS(null, "y1", tick.y1);
        tickSVG.setAttributeNS(null, "y2", tick.y2);
        ticksSVG.appendChild(tickSVG) 
      }
      //

      clock.appendChild(circle);
      clock.appendChild(numbersSVG);
      clock.appendChild(handsSVG);
      clock.appendChild(ticksSVG);

      clockContainer.appendChild(clock);

      document.body.appendChild(clockContainer);

      // Toggle drag class & add mouse listeners
      if (this.draggable) {
        turnOnDragFeature();
      }
      if (this.hMirrored) {
        clockContainer.style.transform = "scaleX(-1)";
      }
      if (this.vMirrored) {
        clockContainer.style.transform = "scaleY(-1)";
      }
    }
    const turnOnDragFeature = () => {
      const clockContainer = document.getElementById("clockwidget-wrapper");
      clockContainer.classList.toggle('-dragging');
      this.dragListeners = addDragListeners();
    }
    const turnOffDragFeature = () => {
      const clockContainer = document.getElementById("clockwidget-wrapper");
      clockContainer.classList.remove('-dragging');
      removeDragListeners();
    }
    const updateTime = () => {
      const sec = this.date.getSeconds();
      const min = this.date.getMinutes();
      const hour = (this.date.getHours() % 12) + min / 60;
      const secangle = sec * 6;
      const minangle = min * 6;
      const hourangle = hour * 30;

      const sechand = document.getElementById("clockwidget-s-hand");
      const minhand = document.getElementById("clockwidget-m-hand");
      const hourhand = document.getElementById("clockwidget-h-hand");

      sechand.setAttribute("transform", "rotate(" + secangle + ",50,50)");
      minhand.setAttribute("transform", "rotate(" + minangle + ",50,50)");
      hourhand.setAttribute("transform", "rotate(" + hourangle + ",50,50)");
    }
    // const appendStyles = () => {
    //   const link = document.createElement("link");
    //   link.href = "index.css";
    //   link.type = "text/css";
    //   link.rel = "stylesheet";
    //   link.media = "screen,print";
    //   document.body.appendChild(link);
    // }
    const addDragListeners = () => {
      let offset = [0,0];
      let isDown = false;
      let mousePosition = {};
      const clockContainer = document.getElementById("clockwidget-wrapper");

      const onMouseDown = e => {
        isDown = true;
        offset = [
          clockContainer.offsetLeft - e.clientX,
          clockContainer.offsetTop - e.clientY
        ];
        clockContainer.classList.toggle('-dragging');
      }

      const onMouseUp = e => {
        isDown = false;
        clockContainer.classList.remove('-dragging');
      }

      const onMouseMove = e => {
        e.preventDefault();
        if (isDown) {
          mousePosition = {
            x : event.clientX,
            y : event.clientY
          };
          clockContainer.style.left = (mousePosition.x + offset[0]) + 'px';
          clockContainer.style.top  = (mousePosition.y + offset[1]) + 'px';
        }
      }

      clockContainer.addEventListener('mousedown', onMouseDown, true);
      document.addEventListener('mouseup', onMouseUp, true);
      document.addEventListener('mousemove', onMouseMove, true)

      return [
        {target: clockContainer, name: 'mousedown', f: onMouseDown},
        {target: document, name: 'mouseup', f: onMouseUp},
        {target: document, name: 'mousemove', f: onMouseMove}
      ]
    }
    const removeDragListeners = () => {
      this.dragListeners.forEach(l => {
        l.target.removeEventListener(l.name, l.f, true)
      })
    }
    const setSize = (newSize, node) => {
      const clock = node || document.getElementById("clockwidget");
  
      const size = typeof newSize === "number" ? newSize : SIZES[newSize]

      clock.setAttributeNS(null, "width", size);
      clock.setAttributeNS(null, "height", size);

      clock.style.transition = "width .5s, height .5s";
    }
    this.update = newOpts => {
      Object.keys(newOpts).forEach(key => {
        const newOpt = newOpts[key];
  
        if (key === 'draggable' && newOpt !== this.opts[key]) {
          newOpt ? turnOnDragFeature() : turnOffDragFeature();
        }

        if (key === 'size' && newOpt !== this.opts[key]) {
          setSize(newOpt);
        }

        if (key === 'speed' && newOpt !== this.opts[key]) {
          clockTimer.updateInterval(1000 / newOpt);
        }

        this.opts[key] = newOpt;
      })
      applyOptions();
    }
    
    // appendStyles();
    drawClock();
    updateTime();

    // Start ticks
    const clockTimer = new InvervalTimer(() => {
      if (!this.lowBattery) {
        this.date.setSeconds(this.date.getSeconds() + (this.countdown ? -1 : 1))
      } else {
        this.date.setSeconds(this.date.getSeconds() + (this.tickCount % 2 === 0 ? 1 : -1))
      }
      updateTime();
      this.tickCount++;
    }, 1000 / this.speed);

    return {
      pause: clockTimer.pause,
      resume: clockTimer.resume,
      update: this.update
    }
  }

  if (typeof module !== "undefined" && module.exports) {
		ClockWidget.default = ClockWidget;
		module.exports = ClockWidget;
	} else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
		// register as "ClockWidget", consistent with npm package name
		define("ClockWidget", [], function () {
			return ClockWidget;
		});
	} else {
		window.ClockWidget = ClockWidget;
  }
}());

// TODO: tick sounds
// TODO: show week day
// TODO: rm listeners on component detroying