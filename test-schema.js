import { insertMessageSchema } from './shared/schema.js';

const payload = {
  name: 'John',
  email: 'john@example.com',
  phone: '',
  farmSize: '',
  message: 'Hello'
};

try {
  insertMessageSchema.parse(payload);
  console.log("Success");
} catch(e) {
  console.log("Fail", e.errors);
}
