module.exports = {
  emptyInput: '',
  undefinedInput: undefined,
  stringInput: 'blue',
  stringInputEncoded: encodeURIComponent('something&nothing=true'),
  arrayInput: ['blue', 'black', 'brown'],
  arrayInputEncoded: ['something&nothing=true', 'hash#data'],
  undefinedArrayInput: [undefined],
  objectInput: { R: 100, G: 200, B: 150 },
  objectNestedObject: { id: 'someID', child: { name: 'childName', age: null, metadata: { name: 'meta' } } },
  objectInputEncoded: { pound: 'something&nothing=true', hash: 'hash#data' },
  undefinedObjectInput: { R: undefined },
};
