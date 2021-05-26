const config = {
  "Key": process.env.TENOR_API_KEY, // https://tenor.com/developer/keyregistration
  "Filter": process.env.TENOR_CONTENT_FILTER || "medium", // "off", "low", "medium", "high", not case sensitive
  "Locale": "en_GB", // Your locale here, case-sensitivity depends on input
  "MediaFilter": "minimal", // either minimal or basic, not case sensitive
  "DateFormat": "DD/MM/YYYY - H:mm:ss A" // Change this accordingly
};
const Tenor = require("tenorjs").client(config);

module.exports = {
  search: function(terms, limit) {
    return Tenor.Search.Query(terms, limit).then(Results => {
      return Results.map(gif => {
        gif.gif_url = gif.media[0].gif.url;
        return gif;
      });
    })
    .catch(console.error);
  },

  get_by_id: function(id) {
    return Tenor.Search.Find([id]).then(Results => {
      console.log(id + ' matches: ' + Results.length);
      const url = Results.map(gif => gif.media[0].gif.url).pop();
      console.log(url);
      return url;
    }).catch(console.error);
  }
};
