module.exports = {
  arrayInput: ['blue', 'black', 'brown'],
  arrayInputEncoded: ['something&nothing=true', 'hash#data'],

  emptyInput: '',

  objectInput: { R: 100, G: 200, B: 150 },
  objectInputEncoded: { pound: 'something&nothing=true', hash: 'hash#data' },

  objectNestedObject: {
    id: 'someID',
    child: { name: 'childName', age: null, metadata: { name: 'meta' } },
  },

  objectNestedObjectOfARidiculiousShape: {
    id: 'someID',
    petLicense: null,
    dog: { name: 'buster', age: 18, treats: ['peanut butter', 'apple'] },
    pets: [
      {
        name: 'buster',
        age: null,
        metadata: { isOld: true },
      },
    ],
  },

  stringInput: 'blue',
  stringInputEncoded: encodeURIComponent('something&nothing=true'),

  undefinedArrayInput: [undefined],
  undefinedInput: undefined,
  undefinedObjectInput: { R: undefined },
};
