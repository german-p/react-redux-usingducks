const { success, failure } = require('../lib/asyncAction');
const assert = require('assert');

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


});