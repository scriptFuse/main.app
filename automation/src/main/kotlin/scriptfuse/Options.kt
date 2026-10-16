package scriptfuse

import java.net.URI

data class Options(
    val packageId: String = "quickScript",
    val language: String = "fr",
    val images: Boolean = false,
    val review: Boolean = false,
    val smoke: Boolean = false,
    val baseUrl: String? = null,
    val channel: String? = null
) {
    companion object {
        fun parse(args: Array<String>): Options {
            var options = Options()
            var index = 0
            fun value(flag: String): String {
                require(index + 1 < args.size && !args[index + 1].startsWith("--")) { "Missing value for $flag" }
                return args[++index]
            }
            while (index < args.size) {
                when (val flag = args[index]) {
                    "--package" -> options = options.copy(packageId = value(flag))
                    "--language" -> options = options.copy(language = value(flag))
                    "--base-url" -> options = options.copy(baseUrl = value(flag))
                    "--channel" -> options = options.copy(channel = value(flag))
                    "--images" -> options = options.copy(images = true)
                    "--review" -> options = options.copy(review = true)
                    "--smoke" -> options = options.copy(smoke = true)
                    else -> error("Unknown option: $flag")
                }
                index++
            }
            require(options.packageId in listOf("quickScript", "booking", "custom")) { "Invalid package" }
            require(options.language in listOf("en", "fr")) { "Language must be en or fr" }
            require(options.channel == null || options.channel in listOf("chrome", "msedge")) { "Channel must be chrome or msedge" }
            options.baseUrl?.let {
                val uri = URI(it)
                require(uri.scheme in listOf("http", "https") && !uri.host.isNullOrBlank()
                    && uri.userInfo == null && uri.query == null && uri.fragment == null) {
                    "Base URL must be an HTTP(S) directory URL without credentials, query or fragment"
                }
            }
            return options
        }
    }
}
