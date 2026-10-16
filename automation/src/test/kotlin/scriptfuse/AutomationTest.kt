package scriptfuse

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.file.Files
import java.nio.file.Path

class AutomationTest {
    @TempDir
    lateinit var directory: Path

    @Test
    fun `defaults fill only and every supported package parses`() {
        val defaults = Options.parse(emptyArray())
        assertFalse(defaults.review)
        assertFalse(defaults.images)
        assertNull(defaults.baseUrl)
        for (id in listOf("quickScript", "booking", "custom")) {
            assertEquals(id, Options.parse(arrayOf("--package", id)).packageId)
        }
        assertTrue(Options.parse(arrayOf("--review", "--images")).review)
    }

    @Test
    fun `invalid arguments fail before opening a browser`() {
        for (args in listOf(
            arrayOf("--package", "unknown"), arrayOf("--package"),
            arrayOf("--language", "xx"), arrayOf("--submit"),
            arrayOf("--base-url", "file:///C:/"),
            arrayOf("--base-url", "https://user:password@example.com/"),
            arrayOf("--base-url", "https://example.com/?token=secret")
        )) {
            assertThrows(RuntimeException::class.java) { Options.parse(args) }
        }
    }

    @Test
    fun `local server serves UTF-8 JavaScript but not parent directories`() {
        val source = Files.createDirectory(directory.resolve("src"))
        Files.writeString(source.resolve("quickScriptPackage.html"), "<html>test</html>")
        Files.writeString(source.resolve("fixture.js"), "const label = 'r\u00e9servation';")
        Files.writeString(directory.resolve("private.txt"), "must not be served")
        val client = HttpClient.newHttpClient()
        LocalSite(source).use { site ->
            fun get(path: String) = client.send(
                HttpRequest.newBuilder(URI(site.baseUrl + path)).build(), HttpResponse.BodyHandlers.ofString()
            )
            val script = get("fixture.js")
            assertEquals(200, script.statusCode())
            assertTrue(script.headers().firstValue("Content-Type").orElse("").contains("text/javascript"))
            assertTrue(script.body().contains("r\u00e9servation"))
            assertEquals(404, get("%2e%2e/private.txt").statusCode())
            assertEquals(404, get("missing.html").statusCode())
            assertEquals(source, LocalSite.findSourceDirectory(directory))
        }
    }
}
