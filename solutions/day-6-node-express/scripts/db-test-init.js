const { configureTestDatabases } = require('../test/test-database-config');
configureTestDatabases();
require('./db-init');
