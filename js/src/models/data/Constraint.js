define([
  'underscore',
  'paper',
  'backbone',
  'models/data/paperUI/Arrow',
  'models/data/paperUI/ConstraintWheel',
  'models/data/paperUI/ConstraintHandles',
  'models/data/paperUI/PositionDelimiter',
  'models/data/paperUI/ScaleDelimiter',
  'models/data/paperUI/RotationDelimiter',
], function(_, paper, Backbone, Arrow, ConstraintWheel, ConstraintHandles, PositionDelimiter, ScaleDelimiter, RotationDelimiter) {

  var propConvMap = {'position:scale': 0.01, 'position:position': 1, 'position:rotation': 1, 'scale:position': 100, 'scale:scale': 1, 'scale:rotation': 100, 'rotation:position': 1, 'rotation:scale': 0.01, 'rotation:rotation': 1};
  var constraintPropMap = {'position': 'translation_delta', 'scale': 'scaling_delta', 'rotation': 'rotation_delta'}; 
  
  var Constraint = Backbone.Model.extend({

    defaults: {
      id: null,

      // properties
      references: null,
      relatives: null,
      ref_type: 'shape',
      rel_type: 'shape',
      ref_prop: 'position_xy',
      rel_prop: 'position_xy', 
      expression: '',
      type: '=',

      // UI
      arrow: null,
      proxy: null,  
      ref_handle: null,
      rel_handle: null,
      commit_box: null, 
      
      // derived state
      constraintFuncs: null
    },

    initialize: function() {
      this.set('arrow', new Arrow({constraint: this}));
      this.set('proxy', new paper.Path());
      this.set('ref_handle', new ConstraintHandles({constraint: this, side: 'ref'}));
      this.set('rel_handle', new ConstraintHandles({constraint: this, side: 'rel'}));
    },

    setSelection: function( instance, type ) {
      if ( this.get('references') && this.get('relatives') ) {
        console.log('[ERROR] References and relatives already set.');
      }
      if ( instance.length == 0 ) { 
        if ( this.get('relatives') ) {
          this.set('relatives', null);
          return false;
        } else {
          return false;
        }
      }
      instance = instance[0];
      instance.set('selected', false);
      if ( this.get('relatives') ) {
        this.set('references', instance);
        this.set('ref_type', type);

        // create proxy with important logic // TODO: maybe class it?
        var constraint = this;
        var relatives = this.get('relatives');
        var references = this.get('references');
        var rel_geom = relatives.get('geom');
        var ref_geom = references.get('geom');
        var proxy =  rel_geom.clone();
        proxy.name = 'proxy';
        proxy.bringToFront();
        proxy.visible = false;
        proxy.show = function() { 
          relatives.set('visible', false);
          relatives.get('geom').visible = false; // REALLY HACKY  
          proxy.visible = true; 
        }
        proxy.hide = function() { 
          relatives.set('visible', true);
          relatives.get('geom').visible = true; // REALLY HACKY
          proxy.visible = false; 
        }
        proxy.reset = function() {
          this.scaling = 1; 
          this.rotation = rel_geom.rotation;
          this.position = rel_geom.position;
          paper.view.draw();
        }
        proxy.matchProperty = function( ref_prop, rel_prop ) {
          var refPropValue, relPropValue;
          var ref_prop_doub = ( ref_prop.split('_')[1] && ref_prop.split('_')[1] == 'xy' );
          var rel_prop_doub = ( rel_prop.split('_')[1] && rel_prop.split('_')[1] == 'xy' );
          var propSwitch = function( prop, side ) {
            var propValue, geom;
            if ( side == 'ref' ) { geom = ref_geom; }
            if ( side == 'rel' ) { geom = proxy; } 
            switch ( prop ) {
              case 'scale_x':
                propValue = geom.scaling.x;
                break;
              case 'scale_y':
                propValue = geom.scaling.y;
                break;
              case 'scale_xy':
                propValue = {x: geom.scaling.x, y: geom.scaling.y}; 
                break;
              case 'position_x':
                propValue = geom.position.x;
                break;
              case 'position_y':
                propValue = geom.position.y;
                break;
              case 'position_xy':
                propValue = {x: geom.position.x, y: geom.position.y};
                break;
              case 'rotation':
                propValue = geom.rotation;
                break;
            }
            return propValue;
          }
          refPropValue = propSwitch( ref_prop, 'ref' );
          relPropValue = propSwitch( rel_prop, 'rel' );

          ref_prop_strip = ref_prop.split('_')[0];
          rel_prop_strip = rel_prop.split('_')[0];
          var convertFactor = propConvMap[ref_prop_strip + ':' + rel_prop_strip];
          var conversion, offset;

          if ( ref_prop_doub && rel_prop_doub ) {
            conversion = {x: refPropValue.x * convertFactor, y: refPropValue.y * convertFactor};
            offset = {x: relPropValue.x - conversion.x, y: relPropValue.y - conversion.y};    
          } else if ( ref_prop_doub ) {
            conversion = refPropValue.x * convertFactor + refPropValue.y * convertFactor;
            offset = {x: relPropValue - conversion};
          } else if ( rel_prop_doub ) {
            conversion = {x: refPropValue * convertFactor, y: refPropValue * convertFactor};
            offset = {x: relPropValue.x - conversion.x, y: relPropValue.y - conversion.y};
          } else {
            conversion = refPropValue * convertFactor;
            offset = {x: relPropValue - conversion};
          }
         
          var exp_scale = 'y = ' + convertFactor.toString() + ' * ' + 'x';
          var exp_object = {};
          for (var axis in offset) {
            exp_object[axis] = exp_scale + ' + ' + offset[axis].toString();
          }
          console.log('expression object', exp_object);
          constraint.set('expression', exp_object);
        }

        this.set('proxy', proxy);
        this.set('id', (references.get('id') + ':' + relatives.get('id')));
        return true;
      }
      this.set('relatives', instance);
      this.set('rel_type', type);
      return false;
    },

    createArrow: function() {
      var arrow = new Arrow( {constraint: this} );
      this.set('arrow', arrow);
    },

    create: function() {
      var ref_prop = this.get('ref_prop').split('_');
      var rel_prop = this.get('rel_prop').split('_');
      var ref_doub = (ref_prop[1] && ref_prop[1] == 'xy');
      var rel_doub = (rel_prop[1] && rel_prop[1] == 'xy');

      var reference = this.get('references');
      var relative = this.get('relatives');
      var expression = this.get('expression');

      var refPropAccess = reference.get( constraintPropMap[ref_prop[0]] );
      var relPropAccess = relative.get( constraintPropMap[rel_prop[0]] );
      console.log('refPropAccess', refPropAccess);
      console.log('relPropAccess', relPropAccess);

      if ( ref_doub && !rel_doub ) {
        var constraintF = function() {
          var refPropValue = refPropAccess.getValue();
          var x = refPropValue.x + refPropValue.y;
          var y;
          eval( expression['x'] );
          if ( rel_prop[0] == 'rotation' ) { 
            relPropAccess.setValue( y );
          } else {
            relPropAccess[rel_prop[1]].setValue( y );
          }
          return y;
        }
      }
      else if ( ref_doub && rel_doub ) {
        var constraintF = function() {
          var evalObj = {};
          for (var axis in expression) {
            var x = refPropAccess[axis].getValue();
            console.log('x-val', x);
            var y;
            eval(expression[axis]);
            console.log('y-val', y);
            evalObj[axis] = y;
          }
          console.log('evalObj', evalObj);
          relPropAccess.setValue(evalObj);
          return evalObj;
        }
      } else if ( !ref_doub && rel_doub ) {
        var constraintF = function() {
          var evalObj = {};
          var x = (ref_prop[0] == 'rotation') ? refPropAccess.getValue() : refPropAccess[ref_prop[1]].getValue();
          for (var axis in expression) {
            var y;
            eval( expression[axis] );
            evalObj[axis] = y;
          }
          relPropAccess.setValue(evalObj);
          return evalObj;
        }
      } else {
        var constraintF = function() {
          var x = (ref_prop[0] == 'rotation') ? refPropAccess.getValue() : refPropAccess[ref_prop[1]].getValue();
          var y, relPropObj;
          eval( expression['x'] );
          if ( rel_prop[0] == 'rotation' ) {
            relPropAccess.setValue( y );
            relPropObj = y;
          } else {
            relPropAccess[rel_prop[1]].setValue( y );
          }
          return y;
        }
      }
      if ( rel_doub ) {
        relPropAccess.setConstraint( constraintF );
      } else {
        relPropAccess[rel_prop[1]].setConstraint( constraintF );
      }
      this.set('constraintFunc', constraintF );
    },

    clearUI: function() {
      this.get('proxy').remove();
      this.get('arrow').remove();
      this.get('ref_handle').remove();
      this.get('rel_handle').remove();
      this.set('proxy', null);
      this.set('arrow', null);
      this.set('ref_handle', null);
      this.set('rel_handle', null);
    },

    remove: function() {
      // remove all paper UI elements
      // trigger nullification / deletion of all references
    },

    reset: function() {
      var arrow = this.get('arrow');
      this.clear().set(this.defaults);
      this.set('arrow', arrow);
    }

  });

  return Constraint;
});