/**
 * A minimal in-memory stand-in for a Mongoose Model, implementing only the
 * methods actually used in routes/queue.js and utils/queueHelpers.js:
 *   find, findOne, findOneAndUpdate, create, countDocuments, deleteMany
 * plus instance .save() on documents returned by find/findOne, and
 * chainable .sort()/.lean() on query results (find AND findOne both
 * support this in real Mongoose, e.g. Token.findOne({...}).sort({...})).
 *
 * This exists purely to test business logic (token assignment, queue
 * ordering, wait-time math, concurrency-safe increments) without a real
 * MongoDB connection, which isn't reachable in this sandbox.
 */

function matchesFilter(doc, filter) {
  return Object.entries(filter).every(([key, val]) => doc[key] === val);
}

function applySort(docs, sortSpec) {
  if (!sortSpec) return docs;
  const [field, dir] = Object.entries(sortSpec)[0];
  return [...docs].sort((a, b) => (a[field] - b[field]) * dir);
}

/**
 * A single chainable, thenable query object that supports the exact
 * surface our route code uses: .sort(spec), .lean(), and bare `await`.
 * `single` controls whether the resolved value is one doc (findOne) or
 * an array (find).
 */
class FakeQuery {
  constructor(docs, { single = false, wrapDoc } = {}) {
    this._docs = docs;
    this._sortSpec = null;
    this._single = single;
    this._wrapDoc = wrapDoc;
  }
  sort(spec) {
    this._sortSpec = spec;
    return this;
  }
  _resolveDocs() {
    return applySort(this._docs, this._sortSpec);
  }
  lean() {
    const docs = this._resolveDocs().map((d) => ({ ...d }));
    return Promise.resolve(this._single ? docs[0] || null : docs);
  }
  then(resolve, reject) {
    const docs = this._resolveDocs();
    if (this._single) {
      const doc = docs[0] ? this._wrapDoc({ ...docs[0] }) : null;
      return Promise.resolve(doc).then(resolve, reject);
    }
    const wrapped = docs.map((d) => this._wrapDoc({ ...d }));
    return Promise.resolve(wrapped).then(resolve, reject);
  }
}

function createFakeModel(initialDocs = [], schemaDefaults = {}) {
  let store = [...initialDocs];
  let idCounter = 1;

  function applyDefaults(data) {
    const result = { ...data };
    for (const [key, defaultVal] of Object.entries(schemaDefaults)) {
      if (result[key] === undefined) result[key] = defaultVal;
    }
    return result;
  }

  function wrapDoc(doc) {
    // Attach a .save() method that writes changes back into the store
    Object.defineProperty(doc, 'save', {
      value: function () {
        const idx = store.findIndex((d) => d._id === doc._id);
        if (idx !== -1) store[idx] = { ...doc };
        return Promise.resolve(doc);
      },
      enumerable: false
    });
    return doc;
  }

  return {
    find(filter = {}) {
      const matched = store.filter((d) => matchesFilter(d, filter));
      return new FakeQuery(matched, { single: false, wrapDoc });
    },
    findOne(filter = {}) {
      const matched = store.filter((d) => matchesFilter(d, filter));
      return new FakeQuery(matched, { single: true, wrapDoc });
    },
    async findOneAndUpdate(filter, update, options = {}) {
      let doc = store.find((d) => matchesFilter(d, filter));
      if (!doc) {
        if (!options.upsert) return null;
        doc = applyDefaults({ _id: idCounter++, ...filter });
        store.push(doc);
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          doc[k] = (doc[k] || 0) + v;
        }
      }
      const directSets = { ...update };
      delete directSets.$inc;
      Object.assign(doc, directSets);

      return wrapDoc({ ...doc });
    },
    async create(data) {
      const doc = applyDefaults({ _id: idCounter++, ...data });
      store.push(doc);
      return wrapDoc({ ...doc });
    },
    async countDocuments(filter = {}) {
      return store.filter((d) => matchesFilter(d, filter)).length;
    },
    async deleteMany() {
      store = [];
      return { acknowledged: true };
    },
    _debugDump() {
      return store;
    }
  };
}

module.exports = { createFakeModel };
