const env = process.env.NODE_ENV;
const { create } = await import(`./.config/${env}.js`);

export default {
  ...create(),
};
