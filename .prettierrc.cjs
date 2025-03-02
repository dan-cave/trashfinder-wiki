module.exports = {
  plugins:[
    require.resolve("prettier-plugin-go-template")
  ],
  overrides: [
    {
      "files": ["*.html"],
      "options": {
        "parser": "go-template"
      }
    }
  ]
};