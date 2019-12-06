
const chai = require('chai');
const { success, failure } = require('react-redux-async-action');
const usingDucks = require('../src/usingDucks');

const should = chai.should();

describe('usingDucks', () => {
  it('should return an object with the makeActionCreator', () => {
    const { makeActionCreator } = usingDucks();
    should.exist(makeActionCreator);
    makeActionCreator.should.be.a('function');
  });

  it('should return an object with the createReducer function', () => {
    const { createReducer } = usingDucks();
    should.exist(createReducer);
    createReducer.should.be.a('function');
  });

  it('should fail if providing a namespace that is not a string', () => {
    function usingDucksCall() { usingDucks(null, {}); }
    usingDucksCall.should.throw(Error, 'The namespace must be a string');
  });

  describe('makeActionCreator', () => {
    it('should return the actionCreator function', () => {
      const actionCreator = usingDucks().makeActionCreator({ type: 'LOGIN' });

      should.exist(actionCreator);
      actionCreator.should.be.a('function');
    });

    describe('the action creator function returned by makeActionCreator', () => {
      it('should fail if no action definition object is provided', () => {
        const { makeActionCreator } = usingDucks();
        function makeActionCreatorCall() { makeActionCreator(); }

        makeActionCreatorCall.should.throw(Error, 'The action definition parameter is required');
      });
      it('should fail if the action definition object does not provide a value', () => {
        const { makeActionCreator } = usingDucks();
        function makeActionCreatorCall() { makeActionCreator({ }); }

        makeActionCreatorCall.should.throw(Error, 'The action definition must have a value for type');
      });
      it('should fail if the action definition object type value is not a string', () => {
        const { makeActionCreator } = usingDucks();
        function makeActionCreatorCall() { makeActionCreator({ type: { } }); }

        makeActionCreatorCall.should.throw(Error, 'The action definition type must be a string');
      });

      it('should return an action with the specified type', () => {
        const actionCreator = usingDucks().makeActionCreator({ type: 'LOGIN' });
        const action = actionCreator();

        should.exist(action);
        action.should.have.property('type', 'LOGIN');
      });

      it('should return an action prefixed with the namespace provided in usingDucks', () => {
        const actionCreator = usingDucks(null, 'namespace').makeActionCreator({ type: 'LOGIN' });
        const action = actionCreator();

        should.exist(action);
        action.should.have.property('type', '[namespace] LOGIN');
      });

      it('should return an action that has a payload property with the value of the first argument of the actionCreator', () => {
        const actionCreator = usingDucks().makeActionCreator({ type: 'LOGIN' });

        const action = actionCreator('payload value');

        should.exist(action);
        action.should.have.property('payload', 'payload value');
      });
    });


    describe('createReducer', () => {
      it('should return a function', () => {
        const reducer = usingDucks().createReducer();
        should.exist(reducer);
      });

      describe('the reducer function created by createReducer', () => {
        const initialState = { initialStateField: 'initialValue' };
        it('should return the same state when no actions match', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          const loginAction = makeActionCreator({ type: 'LOGIN' });
          const reducer = createReducer();

          const state = { current: 'state' };
          const newState = reducer(state, loginAction);

          should.exist(newState);
          newState.should.equal(state);
        });
        it('should return the initialState when no state is provided', () => {
          const { createReducer } = usingDucks(initialState);
          const reducer = createReducer();

          const newState = reducer();

          should.exist(newState);
          newState.should.deep.equal(initialState);
        });
        it('should use the reducer function from options parameter when the action type is dispatched', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          const actionCreator = makeActionCreator({
            type: 'LOGIN',
            reducer: (state, payload) => ({ ...state, username: payload }),
          });
          const action = actionCreator('actionPayload');
          const state = {};

          const reducer = createReducer();
          const newState = reducer(state, action);

          should.exist(newState);
          newState.should.not.equal(state);
          newState.should.have.property('username', 'actionPayload');
        });
        it('should use the successReducer function from options parameter when the _SUCCESS action type is dispatched', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          const loginActionCreator = makeActionCreator({
            type: 'LOGIN',
            successReducer: (state, payload) => ({ ...state, username: payload }),
          });
          const state = {};
          const loginAction = loginActionCreator('actionPayload');

          const reducer = createReducer();
          const newState = reducer(state, success(loginAction));

          should.exist(newState);
          newState.should.not.equal(state);
          newState.should.have.property('username', 'actionPayload');
        });
        it('should use the failureReducer function from options parameter when the _FAILURE action type is dispatched', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          const loginActionCreator = makeActionCreator({
            type: 'LOGIN',
            failureReducer: (state, payload, error) => ({ ...state, login_failed: true, error }),
          });
          const state = {};
          const loginAction = loginActionCreator('actionPayload');

          const reducer = createReducer();
          const newState = reducer(state, failure(loginAction, new Error('login error!')));

          should.exist(newState);
          newState.should.not.equal(state);
          newState.should.have.property('login_failed', true);
          newState.should.have.property('error');
          newState.error.should.have.property('message', 'login error!');
        });
        it('should not handle actions that were not created or configured for the duck', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          makeActionCreator({
            type: 'LOGIN',
            reducer: (state, payload) => ({ ...state, username: payload }),
          });
          const state = {};

          const reducer = createReducer();
          const newState = reducer(state, { type: 'LOGOUT' });
          newState.should.deep.equal(state);
        });
        it('should throw an error if the provided reducer does not return a state object', () => {
          const { makeActionCreator, createReducer } = usingDucks();
          const actionCreator = makeActionCreator({ type: 'LOGIN', reducer: (state, payload) => { } }); // eslint-disable-line no-unused-vars
          const action = actionCreator('actionPayload');
          const reducer = createReducer();

          function reducerCall() { reducer({}, action); }

          reducerCall.should.throw(Error, 'The reducer of the LOGIN action does not return a state object');
        });
      });

      describe('when tracking the async call', () => {
        describe('with a field name', () => {
          let ctx = {};
          beforeEach(() => {
            const duck = usingDucks();
            ctx = {
              makeActionCreator: duck.makeActionCreator,
              createReducer: duck.createReducer,
              actionCreator: duck.makeActionCreator({
                type: 'LOGIN',
                trackWith: 'isLoggingIn',
              }),
              reducer: duck.createReducer(),
            };
          });
          it('should default the state to false', () => {
            const state = ctx.reducer();
            should.exist(state);
            state.should.have.property('isLoggingIn', false);
          });
          it('should add the field to the state with the true value when the action is reduced', () => {
            const state = ctx.reducer({}, ctx.actionCreator());

            should.exist(state);
            state.should.have.property('isLoggingIn', true);
          });
          it('should add the field to the state with the false value when the _SUCCESS action is reduced', () => {
            const state = ctx.reducer({}, success(ctx.actionCreator()));

            should.exist(state);
            state.should.have.property('isLoggingIn', false);
          });
          it('should add the field to the state with the false value when the _FAILURE action is reduced', () => {
            const state = ctx.reducer({}, failure(ctx.actionCreator(), new Error('')));

            should.exist(state);
            state.should.have.property('isLoggingIn', false);
          });

          it('should add the field and reduce the provided reducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              reducer: state => ({ ...state, reducerCalled: true }),
              trackWith: 'isFetching',
            });
            const state = ctx.reducer({}, fetchDataCreator());

            should.exist(state);
            state.should.have.property('isFetching', true);
            state.should.have.property('reducerCalled', true);
          });

          it('should add the field and reduce the provided successReducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              successReducer: (state, payload) => ({ ...state, successReducerPayload: payload }),
              trackWith: 'isFetching',
            });
            const state = ctx.reducer({}, success(fetchDataCreator('payload data')));

            should.exist(state);
            state.should.have.property('isFetching', false);
            state.should.have.property('successReducerPayload', 'payload data');
          });
          it('should add the field and reduce the provided failureReducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              failureReducer: (state, payload, error) => ({ ...state, failureReducer: payload, error }),
              trackWith: 'isFetching',
            });
            const state = ctx.reducer({}, failure(fetchDataCreator('payload data'), { message: 'error message', stack: 'error stack' }));

            should.exist(state);
            state.should.have.property('isFetching', false);
            state.should.have.property('failureReducer', 'payload data');
            state.should.have.property('error').and.deep.equal({ message: 'error message', stack: 'error stack' });
          });
        });
        describe('with a function', () => {
          let ctx;
          beforeEach(() => {
            const duck = usingDucks();
            ctx = {
              makeActionCreator: duck.makeActionCreator,
              createReducer: duck.createReducer,
              actionCreator: duck.makeActionCreator({
                type: 'LOGIN',
                trackWith: (state, payload, isRunning) => ({ ...state, isRunning }),
              }),
              reducer: duck.createReducer(),
            };
          });

          it('should default the state to false', () => {
            const state = ctx.reducer();
            should.exist(state);
            state.should.have.property('isRunning', false);
          });
          it('should throw an error if trackWith function returns no state', () => {
            const faultyAction = ctx.makeActionCreator({
              type: 'LOGOUT',
              trackWith: (state, payload, isRunning) => {}, // eslint-disable-line no-unused-vars
            });
            function reduceCall() {
              ctx.reducer({}, faultyAction());
            }
            reduceCall.should.throw(Error, 'trackWith function of the LOGOUT action should return a state object');
          });
          it('should use the function to reduce the state providing the true value when the action is reduced', () => {
            const state = ctx.reducer({}, ctx.actionCreator());

            should.exist(state);
            state.should.have.property('isRunning', true);
          });
          it('should use the function to reduce the state providing the false value when the _SUCCESS action is reduced', () => {
            const state = ctx.reducer({}, success(ctx.actionCreator()));

            should.exist(state);
            state.should.have.property('isRunning', false);
          });
          it('should use the function to reduce the state providing the false value when the _FAILURE action is reduced', () => {
            const state = ctx.reducer({}, failure(ctx.actionCreator(), new Error('')));

            should.exist(state);
            state.should.have.property('isRunning', false);
          });

          it('should add the field and reduce the provided reducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              reducer: (state, payload) => ({ ...state, reducerCalled: payload }),
              trackWith: (state, payload, isFetching) => ({ ...state, isFetching }),
            });
            const state = ctx.reducer({}, fetchDataCreator('payload data'));

            should.exist(state);
            state.should.have.property('isFetching', true);
            state.should.have.property('reducerCalled', 'payload data');
          });

          it('should add the field and reduce the provided successReducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              successReducer: (state, payload) => ({ ...state, reducerCalledWith: payload }),
              trackWith: (state, payload, isFetching) => ({ ...state, isFetching }),
            });
            const state = ctx.reducer({}, success(fetchDataCreator('payload data')));

            should.exist(state);
            state.should.have.property('isFetching', false);
            state.should.have.property('reducerCalledWith', 'payload data');
          });
          it('should add the field and reduce the provided failureReducer', () => {
            const fetchDataCreator = ctx.makeActionCreator({
              type: 'FETCH_DATA',
              failureReducer: (state, payload, error) => ({ ...state, reducerCalledWith: payload, error }),
              trackWith: (state, payload, isFetching) => ({ ...state, isFetching }),
            });
            const error = { message: 'error message', stack: 'stack trace' };
            const state = ctx.reducer({}, failure(fetchDataCreator('payload data'), error));

            should.exist(state);
            state.should.have.property('isFetching', false);
            state.should.have.property('reducerCalledWith', 'payload data');
            state.should.have.property('error').and.deep.equal(error);
          });
        });
      });

      describe('when providing child reducers', () => {
        it('should use the reducer function from options parameter when the action type is dispatched', () => {
          const { createReducer } = usingDucks();
          const childDuck = usingDucks();

          const childActionCreator = childDuck.makeActionCreator({
            type: 'LOGIN',
            reducer: (state, payload) => ({ ...state, username: payload }),
          });

          const childAction = childActionCreator('actionPayload');
          const state = {
            initialValue: 42,
          };

          const reducer = createReducer({ childDuckReducer: childDuck.createReducer() });

          const newState = reducer(state, childAction);

          should.exist(newState);
          newState.should.not.equal(state);
          newState.should.have.property('initialValue', 42);
          newState.should.have.property('childDuckReducer');
          newState.childDuckReducer.should.have.property('username', 'actionPayload');
        });
        it('should throw an error if childReducer contains items that are not functions', () => {
          const { createReducer } = usingDucks();
          const childDuck = usingDucks();

          const childActionCreator = childDuck.makeActionCreator({
            type: 'LOGIN',
            reducer: (state, payload) => ({ ...state, username: payload }),
          });

          const childAction = childActionCreator('actionPayload');
          const state = {
            initialValue: 42,
          };

          // const reducer = createReducer({ childDuckReducer: 'NOT A FUNCTION' });
          should.throw(() => createReducer({ childDuckReducer: 'NOT A FUNCTION' }), Error, 'childReducers.childDuckReducer is not a function');


          // const newState = reducer(state, childAction);

          // should.exist(newState);
          // newState.should.not.equal(state);
          // newState.should.have.property('initialValue', 42);
          // newState.should.have.property('childDuckReducer');
          // newState.childDuckReducer.should.have.property('username', 'actionPayload');
        });
      });
    });
  });

  describe('when reducing external actions', () => {
    it('should throw an error if the first parameter is not a string or a function', () => {
      const { reduce } = usingDucks();
      function reduceCall() { reduce({}, (state) => {}); } // eslint-disable-line no-unused-vars

      reduceCall.should.throw(Error, 'actionType parameter must be a string or a function');
    });
    it('should throw an error if the first parameter is null', () => {
      const { reduce } = usingDucks();
      function reduceCall() { reduce(null, (state) => {}); } // eslint-disable-line no-unused-vars

      reduceCall.should.throw(Error, 'actionType parameter must be a string or a function');
    });

    describe('using a string action type', () => {
      it('should reduce the action when is dispatched', () => {
        const { createReducer, reduce } = usingDucks();

        reduce('EXTERNAL_ACTION', state => ({ ...state, extAction: true }));
        const reducer = createReducer();
        const newState = reducer({}, { type: 'EXTERNAL_ACTION' });

        newState.should.have.property('extAction', true);
      });

      it('should throw an error if the action type is already being reduced', () => {
        const { reduce } = usingDucks({}, 'namespace');
        reduce('EXTERNAL_ACTION', (state) => {}); // eslint-disable-line no-unused-vars
        function repeatedReduceCall() { reduce('EXTERNAL_ACTION', (state) => {}); } // eslint-disable-line no-unused-vars

        repeatedReduceCall.should.throw(Error, 'EXTERNAL_ACTION is already being reduced by this [namespace] duck. Unify your reducer code in the action definition reducer');
      });

      it('should throw an error if the reducer function is not provided', () => {
        const { reduce } = usingDucks();
        function reduceCall() { reduce('EXTERNAL_ACTION'); }
        reduceCall.should.throw(Error, 'The reducer function argument for EXTERNAL_ACTION reduce is required');
      });
    });

    describe('using a function', () => {
      it('should reduce the action if the function provided returns true', () => {
        const { createReducer, reduce } = usingDucks();

        reduce(action => action.type.startsWith('EXTERNAL'), state => ({ ...state, extAction: true }));
        const reducer = createReducer();
        const newState = reducer({}, { type: 'EXTERNAL_ACTION' });

        newState.should.have.property('extAction', true);
      });

      it('should return the same state if no reducers match the condition', () => {
        const { createReducer, reduce } = usingDucks();

        reduce(action => action.type.startsWith('EXTERNAL'), state => ({ ...state, extAction: true }));
        const reducer = createReducer();
        const state = {};
        const newState = reducer(state, { type: 'LOGIN' });

        newState.should.equal(state);
      });
    });
  });
});
