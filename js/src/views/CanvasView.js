/*CanvasView.js
 * controls updates to the canvas- where all the drawing should happen... */

define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'models/data/properties/PPoint'

], function($, _, Backbone, paper, PPoint) {


  var prototypes, currentId;
  var tool;
  //booleans for keeping track of whether user is clicking on sub or main canvas
  var sub, main, inactive, active;
  var sb;

  var loadKey = 76; // l
  var panKey = 32; // 
  var rootKey = 82; // r
  var groupKey = 71; // g
  var functionKey = 70; //f
  var deleteKey = 67; // c
  var paramKey = 80; // p
  var upArrow = 38; // up arrow
  var downArrow = 40; // down arrow
  var rightArrow = 39; // right arrow
  var leftArrow = 37; // left arrow
  var pan, alt, cmd, shift = false;
  var origin_key = 79;
  var undo_key = 90;
  var redo_key = 86;
  var select_all_key = 65;

  // explore ensuring key combinations (e.g. shift-click selects but shift advances)
  var advanceKey = 78; // n EXPERIMENTAL
  var retreatKey = 66; // b EXPERIMENTAL                           

  var last = {
    x: 0,
    y: 0
  };
  var CanvasView = Backbone.View.extend({
    //

    defaults: {

    },

    initialize: function() {
      $(window).scroll(function() {
        $(window).scrollTop(0);
      });
      $(".sub-canvas-container").resizable();
      prototypes = [];
      currentId = -1;
      sub = {
        down: false,
        inside: false
      };
      main = {
        down: false,
        inside: false
      };
      inactive = sub;
      active = main;



      //TODO: this is a hacky way to to detect key events
      _.bindAll(this, "canvasKeydown");
      _.bindAll(this, "canvasKeyup");

      $(document).bind('keydown', this.canvasKeydown);
      $(document).bind('keyup', this.canvasKeyup);

      $(window).bind('focus', this.setFocus);

      $("#sub-canvas").bind('mousedown', this.subCanvasMouseDown);
      $("#sub-canvas").bind('mouseup', {
        parent: this
      }, this.subCanvasMouseUp);

      $("#sub-canvas").bind('mouseenter', this.enterSub);
      $("#sub-canvas").bind('mouseleave', this.leaveSub);
      $("#sub-canvas").bind('dblclick', {
        parent: this
      }, this.subDblclick);

      //bind paper tool events
      tool = new paper.Tool();
      tool.name = 'canvas_tool';
      tool.activate();
      tool.parent = this;
      tool.attach('mousedown', this.toolMouseDown);
      tool.attach('mousedrag', this.toolMouseDrag);
      tool.attach('mouseup', this.toolMouseUp);
      this.listenTo(this.model, 'centerGeom', this.centerGeom);

      paper.view.parent = this;

      window.onbeforeunload = function() {
        return 'unsaved changes';
      };

    },

    //canvas events
    events: {
      'mousedown': 'canvasMouseDown',
      'mouseup': 'canvasMouseUp',
      'mousemove': 'canvasMouseMove',
      'mouseenter': 'enterMain',
      'mouseleave': 'leaveMain',
      'mousewheel': 'canvasMousewheel',
      'dblclick': 'canvasDblclick'
    },

    setFocus: function() {
      pan = false;
      alt = false;
    },

    pauseKeyListeners: function() {
      $(document).unbind('keydown');
      $(document).unbind('keyup');
    },

    unpauseKeyListeners: function() {
      $(document).bind('keydown', this.canvasKeydown);
      $(document).bind('keyup', this.canvasKeyup);
    },

    /* sets main canvas as active 
     * by setting inactive to subDown
     */
    setMainActive: function() {
      inactive = sub;
      active = main;
    },

    /* sets sub canvas as active 
     * by setting inactive to mainDown
     */
    setSubActive: function() {
      inactive = main;
      active = sub;

    },



    /* tool mouse event functions */

    toolMouseDown: function(event) {
      if (!inactive.inside) {
        this.parent.model.toolMouseDown(event, pan);
      }
    },

    toolMouseUp: function(event) {
      this.parent.model.toolMouseUp(event, pan);
    },

    toolMouseDrag: function(event) {
      if (!inactive.down) {

        this.parent.model.toolMouseDrag(event, pan);
      }
    },


    toolMouseMove: function(event) {
      this.parent.model.toolMouseMove(event);
    },


    /* canvas event functions */
    canvasKeydown: function(event) {
      /*if (event.keyCode == saveKey) {
        this.model.save();
      }*/

      if (event.keyCode == undo_key) {
        this.model.undo();
      }
      if (event.keyCode == redo_key) {
        this.model.redo();
      }
      if (event.keyCode == origin_key && shift) {
        this.model.zeroOrigin();
      }
      if (event.keyCode == functionKey) {
        //this.model.createFunction();
      }
      if (event.keyCode == paramKey) {
        this.model.createParams();
      }
      if (shift) {
        if (event.keyCode == select_all_key) {
          this.model.selectAllShapes();
        }
        if (event.keyCode == upArrow) {
          this.model.closeSelected();
        } else if (event.keyCode == downArrow) {
          this.model.openSelected();
        }
      }
      if (event.keyCode === deleteKey) {
        this.model.deleteInstance();
      }
      if (event.keyCode === panKey) {
        pan = true;
      }
      if (event.altKey) {
        alt = true;
      }
      if (event.cmdKey) {
        cmd = true;
      }

      if (event.shiftKey) {
        shift = true;
      }
      if (event.keyCode === rootKey) {}
      if (event.keyCode === groupKey) {
        this.model.createList();
      }
    },

    canvasKeyup: function(event) {


      if (!event.shiftKey) {
        shift = false;
      }
      pan = false;
      alt = false;
      cmd = false;

    },

    //enter and leave functions manage keyboard events by focusing the canvas elemennt
    enterMain: function() {
      this.$el.addClass('hover');
      var span = this.$el.find('span');
      span.attr('tabindex', '1').attr('contenteditable', 'true');
      span.focus();
      main.inside = true;
    },

    leaveMain: function() {
      this.$el.removeClass('hover');
      var span = this.$el.find('span');
      span.removeAttr('contenteditable').removeAttr('tabindex');
      span.blur();
      main.inside = false;
    },

    enterSub: function() {
      sub.inside = true;
    },

    leaveSub: function() {
      sub.inside = false;
    },

    canvasMouseDown: function(event) {

      main.down = true;
    },

    canvasMouseUp: function(event) {

      if (sub.down) {}
      main.down = false;
      sub.down = false;
    },

    subCanvasMouseDown: function(event) {
      sub.down = true;
    },

    subCanvasMouseUp: function(event) {
      if (main.down) {

      }
      sub.down = false;
      main.down = false;
    },


    canvasMouseMove: function(event) {

      if (active) {
        var delta = {
          x: event.offsetX - last.x,
          y: event.offsetY - last.y
        };
        this.model.canvasMouseDrag(delta, pan);
      }

      last.x = event.offsetX;
      last.y = event.offsetY;

    },

    canvasMousewheel: function(event) {
      this.model.canvasMouseWheel(event, pan, alt);

    },

    canvasDblclick: function(event) {
      this.model.canvasDblclick();
    },



  });

  return CanvasView;

});