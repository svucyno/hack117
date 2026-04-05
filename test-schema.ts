import { insertMessageSchema } from './shared/schema.ts';

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
} catch(e: any) {
  console.log("Fail", JSON.stringify(e.errors));
}
