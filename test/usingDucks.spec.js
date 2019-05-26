
const chai = require('chai');
const { usingDucks } = require('../src/usingDucks');
const should = chai.should();
const { success, failure } = require('../src/asyncAction');

describe('when usingDucks', ()=> {
  
  it('should return an object with the newActionCreator', ()=> {
    const { newActionCreator } = usingDucks('test');
    should.exist(newActionCreator);
    newActionCreator.should.be.a('function');
  });

  it('should return an object with the createReducer function', ()=> {
    const { createReducer } = usingDucks('test');
    should.exist(createReducer);
    createReducer.should.be.a('function');
  });

  it('should require the duck name', ()=> {
    function usingDucksCall() { usingDucks() };

    usingDucksCall.should.throw(Error, 'Please provide a name for the duck');
  });

  describe('newActionCreator', ()=> {
    it('should return the actionCreator function', ()=> {
      const actionCreator = usingDucks('test').newActionCreator('LOGIN');
      
      should.exist(actionCreator);
      actionCreator.should.be.a('function');
    });

    describe('the action creator function returned by newActionCreator', ()=> {
      it('should fail if no type is provided', ()=> {
        const { newActionCreator } = usingDucks('test');
        function newActionCreatorCall() { newActionCreator(); }     
      
        newActionCreatorCall.should.throw(Error, 'The type parameter is required');
      });
      it('should return an action with the specified type', ()=> {
        const actionCreator = usingDucks('test').newActionCreator('LOGIN');
        const action = actionCreator();
        
        should.exist(action);
        action.should.have.property('type', 'LOGIN');
      });
      it('should return an action that has a payload property with the value of the first argument of the actionCreator', ()=> {
        const actionCreator = usingDucks('test').newActionCreator('LOGIN');

        const action = actionCreator('payload value');
        
        should.exist(action);
        action.should.have.property('payload', 'payload value');
      });
    });

    describe('when providing a reducer function in the options argument', ()=> {
      it('should ignore the reducer if not provided', ()=> {
        usingDucks('test').newActionCreator('LOGIN', {
          reducer: null,
        });        
      });

    });


    describe('createReducer', ()=> {
      it('should return a function', ()=> {
        const reducer = usingDucks('test').createReducer();
        should.exist(reducer);
      });
      
      describe('the reducer function created by createReducer', ()=> {
        const initialState = { initialStateField: 'initialValue' };
        it('should return the same state when no actions match', ()=> {
          const { newActionCreator, createReducer } = usingDucks('test');
          const loginAction = newActionCreator('LOGIN');
          const reducer = createReducer();
          
          const state = { current: 'state' };
          const newState = reducer(state, loginAction);

          should.exist(newState);
          newState.should.equal(state);
        });
        it('should return the initialState when no state is provided', ()=> {
          const { createReducer } = usingDucks('test', initialState);
          const reducer = createReducer();
          
          const newState = reducer();

          should.exist(newState);
          newState.should.deep.equal(initialState);
        });
        
      });

      it('should use the reducer function from options parameter when the action type is dispatched', ()=> {
        const { newActionCreator, createReducer } = usingDucks('test');
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

      
      it('should use the successReducer function from options parameter when the _SUCCESS action type is dispatched', ()=> {
        const { newActionCreator, createReducer } = usingDucks('test');
        const loginActionCreator = newActionCreator('LOGIN', {
          successReducer: (state, payload)=> ({...state, username: payload }),
        });
        const state = {};
        const loginAction = loginActionCreator('actionPayload');
        
        const reducer = createReducer();
        const newState = reducer(state, success(loginAction));

        should.exist(newState);
        newState.should.not.equal(state);
        newState.should.have.property('username', 'actionPayload');
      });

      it('should use the failureReducer function from options parameter when the _FAILURE action type is dispatched', ()=> {
        const { newActionCreator, createReducer } = usingDucks('test');
        const loginActionCreator = newActionCreator('LOGIN', {
          failureReducer: (state, payload, error)=> ({...state, login_failed: true, error }),
        });
        const state = {};
        const loginAction = loginActionCreator('actionPayload');
        
        const reducer = createReducer();
        const newState = reducer(state, failure(loginAction, new Error('login error!')));

        should.exist(newState);
        newState.should.not.equal(state);
        newState.should.have.property('login_failed', true);
        newState.should.have.property('error');
      });

      it('should not handle actions that were not created or configured for the duck', ()=> {
        const { newActionCreator, createReducer } = usingDucks('test');
        newActionCreator('LOGIN', {
          reducer: (state, payload)=> ({...state, username: payload }),
        });
        const state = {};
        
        const reducer = createReducer();
        const newState = reducer(state, { type: 'LOGOUT' });
        newState.should.deep.equal(state);
      });      

      it('should throw an error if the provided reducer does not return a state object', ()=> {
        const { newActionCreator, createReducer } = usingDucks('test');
        const actionCreator = newActionCreator('LOGIN', { reducer: (state, payload)=> { } });
        const action = actionCreator('actionPayload');
        const reducer = createReducer();

        function reducerCall() { reducer({}, action); };

        reducerCall.should.throw(Error, 'The reducer of the LOGIN action does not return a state object');
      });
      
    });

  });

  
  

});