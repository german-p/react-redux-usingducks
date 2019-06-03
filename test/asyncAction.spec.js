const chai = require('chai');
const assert = require('assert');
const sinon = require('sinon');
var sinonChai = require("sinon-chai");
var chaiAsPromised = require("chai-as-promised");
const { success, failure, asThunk } = require('../src/asyncAction');

const should = chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('asyncAction helpers', ()=> {
  describe('success', ()=> {

    describe('when action type is provided', ()=> {
      it('should append _SUCCESS suffix to the action type', ()=> {

        const result = success('ACTION_TYPE');
        assert.equal(result, 'ACTION_TYPE_SUCCESS');

      });
    });

    describe('when action object is provided', ()=> {
      it("should append _SUCCESS suffix to the action object's type field", ()=> {
        const result = success({ type: 'ACTION_TYPE' });
        assert.deepEqual(result, { type: 'ACTION_TYPE_SUCCESS' });
      });
      it("should keep all the other action fields untouched", ()=> {
        const result = success({ type: 'ACTION_TYPE', id: 34, title: 'some string' });
        assert.deepEqual(result, { type: 'ACTION_TYPE_SUCCESS', id: 34, title: 'some string' });
      });

    });
  });

  describe('failure', ()=> {

    describe('when action type is provided', ()=> {
      it('should append _FAILURE suffix to the action type', ()=> {

        const result = failure('ACTION_TYPE');
        assert.equal(result, 'ACTION_TYPE_FAILURE');

      });
    });

    describe('when action object is provided', ()=> {
      it("should append _FAILURE suffix to the action object's type field", ()=> {
        const result = failure({ type: 'ACTION_TYPE' });
        assert.equal(result.type, 'ACTION_TYPE_FAILURE');
      });
      it('should add the error field to the action', ()=> {
        const error = { message: 'errorMessage', stack: 'stack trace' };
        const result = failure({ type: 'ACTION_TYPE' }, error);

        assert.equal(result.error.message, error.message);
        assert.equal(result.error.stack, error.stack);
      });

      it("should keep all the other action fields untouched", ()=> {
        const result = failure({ type: 'ACTION_TYPE', id: 34, title: 'some string' });
        
        assert.equal(result.id, 34);
        assert.equal(result.title, 'some string');
      });

    });
  });

  describe('asThunk', ()=> {
    it('should return a function that accepts a payload and returns a function', ()=> {
      const actionCreator = ()=> ({ type: 'ACTION' });
      const thunkedActionCreator = asThunk(actionCreator);
  
      should.exist(thunkedActionCreator);
      thunkedActionCreator.should.be.a('function');
      const thunk = thunkedActionCreator({ somePayload: 1 });
      should.exist(thunk);
      thunk.should.be.a('function');
    });
  
    describe('when invoked with a dispatcher function', ()=> {
      let dispatch, asyncCall;
      beforeEach(()=> {
        asyncCall = sinon.stub();
        dispatch = sinon.stub();
      });
      
  
      it('should dispatch the action when invoked with a dispatcher function', ()=> {
        const action = { type: 'ACTION',  };
        const actionCreator = ()=> action;
        const thunkedActionCreator = asThunk(actionCreator, asyncCall);
        const thunk = thunkedActionCreator();
    
        thunk(dispatch);
        dispatch.should.have.been.calledWithExactly(action);
      });
    
      it('should invoke the asyncCall with the action payload', async ()=> {
        const actionCreator = (payload)=> ({ type: 'action', payload });
        const expectedPayload = { payload: 'object' }
        const thunkedActionCreator = asThunk(actionCreator, asyncCall);
        const thunk = thunkedActionCreator(expectedPayload); 
        thunk(dispatch);
  
        asyncCall.should.have.been.calledWithExactly(expectedPayload);
      });
  
      describe('when the async action succeeds', ()=> {
        let actionCreator, asyncCallResult;
        beforeEach(()=> {
          actionCreator = (payload)=> ({ type: 'action', payload });
          asyncCallResult = { name: 'Peter' };
          asyncCall.resolves(asyncCallResult);
        });
  
        it('should dispatch the success of the action with the asyncCall result as payload', async ()=> {
          const thunkedActionCreator = asThunk(actionCreator, asyncCall);
          const thunk = thunkedActionCreator(); 
  
          await thunk(dispatch);
  
          dispatch.should.have.been.calledWithMatch({ type: 'action_SUCCESS', payload: asyncCallResult });
        });
  
        describe('and afterSuccess callback is provided', ()=> {
          it('should invoke the afterSuccess callback after dispatching the action success', async ()=> {
            const afterSuccess = sinon.stub();
            const action = { type: 'action' };
            actionCreator = ()=> action;
            dispatch = ()=> {};
            const thunkedActionCreator = asThunk(actionCreator, asyncCall, afterSuccess);
            const thunk = thunkedActionCreator(); 
  
            await thunk(dispatch);
  
            afterSuccess.should.have.been.called;
            afterSuccess.should.have.been.calledWithExactly(action, asyncCallResult, dispatch);
          });
  
          it('should bubble up the error the afterSuccess funcion throws', async ()=> {
            const afterSuccessError = new Error('afterSuccess failed');
            const afterSuccess = sinon.stub();
            afterSuccess.throws(afterSuccessError);
            
            const thunkedActionCreator = asThunk(actionCreator, asyncCall, afterSuccess);
            const thunk = thunkedActionCreator(); 
  
            await thunk(dispatch).should.eventually.be.rejectedWith(afterSuccessError);
          });
          it('should not dispatch the failure action if afterSuccess fails', async ()=> {
            const afterSuccessError = new Error('afterSuccess failed');
            const afterSuccess = sinon.stub();
            afterSuccess.throws(afterSuccessError);
            
            const thunkedActionCreator = asThunk(actionCreator, asyncCall, afterSuccess);
            const thunk = thunkedActionCreator(); 
  
            try {
              await thunk(dispatch);
            } catch {}
            
            dispatch.should.have.not.been.calledWithMatch(failure(actionCreator(), afterSuccessError));
          });
        });
  
  
      });
      describe('when the async action fails', ()=> {
        let thunk, actionCreator, expectedAction;
        const error = new Error('async call error');
        const expectedPayload = { payload: 'object' }
        beforeEach(()=> {
          actionCreator = (payload)=> ({ type: 'action', payload });
          expectedAction = failure(actionCreator(expectedPayload), error);
          asyncCall.rejects(error);
          const thunkedActionCreator = asThunk(actionCreator, asyncCall);
          thunk = thunkedActionCreator(expectedPayload); 
        })
        it('should dispatch the failure of the action', async ()=> {
  
          await thunk(dispatch);
  
          dispatch.should.have.been.calledWithMatch({ type: expectedAction.type });
        });
  
        it('should dispatch the failure of the action with the original action payload', async ()=> {
  
          await thunk(dispatch);
  
          dispatch.should.have.been.deep.calledWithMatch({ payload: expectedAction.payload });
        });
  
        it('should dispatch the failure of the action with the error thrown', async ()=> {
  
          await thunk(dispatch);
  
          dispatch.should.have.been.deep.calledWithMatch({ error: expectedAction.error });
        });
        describe('and afterFailure callback is provided', ()=> {
          it('should invoke the afterFailure callback after dispatching the action failure', async ()=> {
            const asyncCallError = new Error('asyncCallError');
            asyncCall.rejects(asyncCallError);
            const action = { type: 'action' };
            actionCreator = ()=> action;
            const afterFailure = sinon.stub();
            dispatch = ()=> {};
            const thunkedActionCreator = asThunk(actionCreator, asyncCall, null, afterFailure);
            const thunk = thunkedActionCreator(); 
  
            await thunk(dispatch);
  
            afterFailure.should.have.been.called;
            afterFailure.should.have.been.calledWithExactly(action, asyncCallError, dispatch);
          });
  
        });
      });
    })
    
  
  
  });

});