
const chai = require('chai');
const { usingDucks } = require('../src/usingDucks');
const should = chai.should();


describe('when usingDucks', ()=> {
  
  it('should return an object with the newActionCreator', ()=> {
    const { newActionCreator } = usingDucks();
    should.exist(newActionCreator);
    newActionCreator.should.be.a('function');
  });

  it('should return an object with the createReducer function', ()=> {
    const { createReducer } = usingDucks();
    should.exist(createReducer);
    createReducer.should.be.a('function');
  });



  describe('newActionCreator', ()=> {
    it('should return the actionCreator function', ()=> {
      const actionCreator = usingDucks().newActionCreator('LOGIN');
      
      should.exist(actionCreator);
      actionCreator.should.be.a('function');
    });

    describe('the action creator function returned by newActionCreator', ()=> {
      it('should fail if no type is provided', ()=> {
        const { newActionCreator } = usingDucks();
        function newActionCreatorCall() { newActionCreator(); }     
      
        newActionCreatorCall.should.throw(Error, 'The type parameter is required');
      });
      it('should return an action with the specified type', ()=> {
        const actionCreator = usingDucks().newActionCreator('LOGIN');
        const action = actionCreator();
        
        should.exist(action);
        action.should.have.property('type', 'LOGIN');
      });
      it('should return an action that has a payload property with the value of the first argument of the actionCreator', ()=> {
        const actionCreator = usingDucks().newActionCreator('LOGIN');

        const action = actionCreator('payload value');
        
        should.exist(action);
        action.should.have.property('payload', 'payload value');
      });
    });

    describe('when providing a reducer function in the options argument', ()=> {
      it('should ignore the reducer if not provided', ()=> {
        usingDucks().newActionCreator('LOGIN', {
          reducer: null,
        });        
      });

    });

    describe('createReducer', ()=> {
      it('should return a function', ()=> {
        const reducer = usingDucks().createReducer();
        should.exist(reducer);
      });
      
      describe('the reducer function created by createReducer', ()=> {
        const initialState = { initialStateField: 'initialValue' };
        it('should return the same state when no actions match', ()=> {
          const { newActionCreator, createReducer } = usingDucks();
          const loginAction = newActionCreator('LOGIN');
          const reducer = createReducer();
          
          const state = { current: 'state' };
          const newState = reducer(state, loginAction);

          should.exist(newState);
          newState.should.equal(state);
        });
        it('should return the initialState when no state is provided', ()=> {
          const { createReducer } = usingDucks(initialState);
          const reducer = createReducer();
          
          const newState = reducer();

          should.exist(newState);
          newState.should.deep.equal(initialState);
        });
        
      });

      it('should use the reducer function from options parameter when the action type is dispatched', ()=> {
        const { newActionCreator, createReducer } = usingDucks();
        const actionCreator = newActionCreator('LOGIN', {
          reducer: (state, payload)=> ({...state, username: payload }),
        });
        const action = actionCreator('actionPayload');
        const state = {};
        
        const reducer = createReducer();
        const newState = reducer(state, action);

        should.exist(newState);
        newState.should.not.equal(state);
        newState.should.have.property('username', 'actionPayload');
      });

      it('should throw an error if the provided reducer does not return a state object', ()=> {
        const { newActionCreator, createReducer } = usingDucks();
        const actionCreator = newActionCreator('LOGIN', { reducer: (state, payload)=> { } });
        const action = actionCreator('actionPayload');
        const reducer = createReducer();

        function reducerCall() { reducer({}, action); };

        reducerCall.should.throw(Error, 'The reducer of the LOGIN action does not return a state object');
      });
      
    });

  });

  
  

});