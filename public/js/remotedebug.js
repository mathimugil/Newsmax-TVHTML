// Adds the client as a weinre(web inspector remote) debugging target at http://localhost:8082/client/#anonymous
// This is used to debug every mobile browser besides Mobile Safari and Chrome for Android
document.write('<script src="http://' + window.location.hostname + ':8082/target/target-script-min.js#anonymous"><\/script>');