package scriptfuse

import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress
import java.nio.file.Files
import java.nio.file.Path

/** Serves only the site's src directory on loopback, never the repository or credentials. */
class LocalSite(directory: Path) : AutoCloseable {
    private val root = directory.toRealPath()
    private val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    val baseUrl: String get() = "http://127.0.0.1:${server.address.port}/"

    init {
        require(Files.isRegularFile(root.resolve("quickScriptPackage.html"))) { "Site source directory not found: $root" }
        server.createContext("/") { exchange ->
            exchange.use {
                if (exchange.requestMethod !in listOf("GET", "HEAD")) {
                    exchange.sendResponseHeaders(405, -1)
                    return@createContext
                }
                try {
                    val relative = exchange.requestURI.path.trimStart('/').ifEmpty { "index.html" }
                    val candidate = root.resolve(relative).normalize()
                    if (!candidate.startsWith(root) || !Files.isRegularFile(candidate)
                        || !candidate.toRealPath().startsWith(root)) {
                        exchange.sendResponseHeaders(404, -1)
                        return@createContext
                    }
                    val type = when (candidate.fileName.toString().substringAfterLast('.')) {
                        "html" -> "text/html; charset=utf-8"
                        "js" -> "text/javascript; charset=utf-8"
                        "css" -> "text/css; charset=utf-8"
                        else -> "application/octet-stream"
                    }
                    exchange.responseHeaders.set("Content-Type", type)
                    exchange.responseHeaders.set("Cache-Control", "no-store")
                    if (exchange.requestMethod == "HEAD") {
                        exchange.sendResponseHeaders(200, -1)
                    } else {
                        val bytes = Files.readAllBytes(candidate)
                        exchange.sendResponseHeaders(200, bytes.size.toLong())
                        exchange.responseBody.write(bytes)
                    }
                } catch (_: Exception) {
                    // Malformed paths must not expose local filesystem details.
                    runCatching { exchange.sendResponseHeaders(404, -1) }
                }
            }
        }
        server.start()
    }

    override fun close() = server.stop(0)

    companion object {
        fun findSourceDirectory(start: Path = Path.of("").toAbsolutePath()): Path {
            return generateSequence(start) { it.parent }
                .map { it.resolve("src") }
                .firstOrNull { Files.isRegularFile(it.resolve("quickScriptPackage.html")) }
                ?: error("Run from the repository or automation directory so src/ can be found")
        }
    }
}
