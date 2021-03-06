/* Filename: router.js*/
define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'views/CanvasView',
  'views/ToolView',
  'views/PropertyView',
  'models/tools/ToolManager',
  'models/data/MasterManager',

], function($, _, Backbone, paper, CanvasView, ToolView, PropertyView, ToolManager, MasterManager) {
  var masterScope;
  var AppRouter = Backbone.Router.extend({
    routes: { // Default
      '*actions': 'defaultAction'
    }
  });
  var geomgenerator = 5;

  var initialize = function() {
    var app_router = new AppRouter();

    app_router.on('route:defaultAction', function(actions) {

      var canvas = document.getElementById('canvas');
      paper.setup(canvas);

      var geometry_layer = new paper.Layer();
      geometry_layer.name = 'geometry_layer';
      var isolation_layer = new paper.Layer();
      isolation_layer.name = 'isolation_layer';
      var ui_layer = new paper.Layer();
      ui_layer.name = 'ui_layer';
      geometry_layer.activate();

      var toolManager = new ToolManager();
      //setup the canvas view
      var canvasView = new CanvasView({
        el: '#canvas-container',
        model: toolManager
      });



      //setup masterManager and function manager
      var masterManager = new MasterManager();

      canvasView.listenTo(masterManager, 'pauseKeyListeners', canvasView.pauseKeyListeners);
      canvasView.listenTo(masterManager, 'unpauseKeyListeners', canvasView.unpauseKeyListeners);
      /* event listener registers */


      masterManager.listenTo(toolManager, 'undo', masterManager.undo);
      masterManager.listenTo(toolManager, 'redo', masterManager.redo);
      masterManager.listenTo(toolManager, 'modificationEnded', masterManager.modificationEnded);
      masterManager.listenTo(toolManager, 'changeZoom', masterManager.changeZoom);
      masterManager.listenTo(toolManager, 'changePan', masterManager.changePan);
      masterManager.listenTo(toolManager, 'zeroOrigin', masterManager.zeroOrigin);

      masterManager.listenTo(toolManager, 'removeShape', masterManager.removeObject);
      masterManager.listenTo(toolManager, 'addObject', masterManager.addObject);

      masterManager.listenTo(toolManager, 'addConstraint', masterManager.addConstraint);
      masterManager.listenTo(toolManager, 'constraintModeChanged', masterManager.constraintModeChanged);
      masterManager.listenTo(toolManager, 'initConstraintOnSelected', masterManager.initConstraintOnSelected);
      masterManager.listenTo(toolManager, 'toggleOpen', masterManager.toggleOpen);
      masterManager.listenTo(toolManager, 'toggleClosed', masterManager.toggleClosed);
      masterManager.listenTo(toolManager, 'doubleClick', masterManager.toggleItem);

      masterManager.listenTo(toolManager, 'deselectAll', masterManager.deselectAllShapes);
      masterManager.listenTo(toolManager, 'selectAllShapes', masterManager.selectAllShapes);

      masterManager.listenTo(toolManager, 'selectShape', masterManager.selectShape);
      masterManager.listenTo(toolManager, 'deselectShape', masterManager.selectShape);
      masterManager.listenTo(toolManager, 'geometryModified', masterManager.modifyGeometry);
      masterManager.listenTo(toolManager, 'segmentModified', masterManager.modifySegment);
      masterManager.listenTo(toolManager, 'modifyParams', masterManager.modifyParams);
      masterManager.listenTo(toolManager, 'modifyStyle', masterManager.modifyStyle);

      masterManager.listenTo(toolManager, 'changeModeForSelection', masterManager.changeModeForSelection);
      masterManager.listenTo(toolManager, 'selectionRequest', masterManager.getCurrentSelection);


      var toolView = new ToolView({
        el: '#tool-elements',
        model: toolManager
      });


      var propertyView = new PropertyView({
        el: '#prop-menu',
        model: toolManager
      });

      propertyView.render();

    });



    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});