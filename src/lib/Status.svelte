<script>
    import sanitizeHtml from 'sanitize-html';
    import { onMount } from 'svelte';

    let serverStatus = null
    let statusString = ''
    let timeoutId

    async function updateServerInfo(waitTime) {
        if (timeoutId) clearTimeout(timeoutId)
        let lastServerStatus = localStorage.getItem('serverStatusJson');
        let lastServerStatusNext = parseInt(
            localStorage.getItem('serverStatusNext') ?? '0'
        )*1000
        if (Date.now() > lastServerStatusNext) {
            console.log('Fetching')
            let res
            try {
                res = await fetch(
                    'https://api.mcstatus.io/v1/status/java/play.mangomc.net'
                )
            } catch (error) {
                console.log('Fetch failed. ', error)
                timeoutId = setTimeout(() => {
                    updateServerInfo((waitTime??1000)+(60*1000))
                }, waitTime??1000)
            }
            let responseHeaders = Object.fromEntries(res.headers)
            console.log(responseHeaders)
            let timeToNext = 2*60
            if (responseHeaders['x-cache-time-remaining']) {
                timeToNext = parseInt(responseHeaders['x-cache-time-remaining'])
            }
            timeToNext+=5 // Just in case the API's timer is off by a bit.
            serverStatus = await res.json();
            localStorage.setItem(
                'serverStatusJson',
                JSON.stringify(serverStatus)
            );
            localStorage.setItem('serverStatusNext', (Date.now()/1000+(timeToNext)).toString())
            console.log('Saved serverStatus')
            timeoutId = setTimeout(updateServerInfo, timeToNext*1000)
            console.log('Next fetching in', timeToNext, 'seconds')
        } else {
            console.log('ServerStatus read from cache')
            serverStatus = JSON.parse(lastServerStatus)
            timeoutId = setTimeout(updateServerInfo, Math.ceil(lastServerStatusNext-Date.now()))
            console.log('Next fetching in', Math.ceil((lastServerStatusNext-Date.now())/1000), 'seconds')
        }
    }

    onMount(() => {
        updateServerInfo()
        return () => {
            console.log('Clearing timeout')
            if (timeoutId) clearTimeout(timeoutId)
        }
    })

    // https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    // The API for copying text is new, Firefox doesn't entirely support it.
    // This fallback solves that on most browsers

    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement('textarea')
        textArea.value = text
        // Avoid scrolling to bottom
        textArea.style.top = '0'
        textArea.style.left = '0'
        textArea.style.position = 'fixed'

        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        let success = false
        try {
            success = document.execCommand('copy')
            console.log('Fallback: Copying text command was ' + success)
        } catch (err) {
            console.log(err)
            success = false
        }
        document.body.removeChild(textArea)
        return success
    }
    async function copyServerIp() {
        const text = 'play.mangomc.net'
        let success = false
        if (!navigator.clipboard) {
            success = fallbackCopyTextToClipboard(text)
        } else {
            try {
                await navigator.clipboard.writeText(text)
                success = true
            } catch (error) {
                success = false
            }
        }
        if (success) {
            statusString = '(Copied IP)'
            setTimeout(() => statusString = '', 5000)
        } else {
            statusString = '(Failed to copy IP)'
            setTimeout(() => statusString = '', 5000)
        }
        // not bothering to clear timeout, its 5 seconds.
        console.log(statusString)
    }
</script>

<!-- Whitespace messy because don'tcha love css white-space: pre -->

{#if serverStatus}
    <div class="server-info" on:click={copyServerIp}>
        <img
            class="server-info-icon"
            src={serverStatus.response.favicon}
            alt="MangoMC Logo"
        />
        <div class="server-info-content">
            <span class="server-info_top-bar"
                ><span class="server-info_name">MangoMC</span><span class="server-info_status">{statusString}</span><span
                    class="server-info_playercount"
                    >{serverStatus.response.players.online}/{serverStatus
                        .response.players.max}</span
                ></span
            >{@html sanitizeHtml(serverStatus.response.motd.html, {
                allowedTags: ['span'],
                allowedAttributes: {
                    span: ['style'],
                },
            })}
        </div>
    </div>
{/if}
{#if !serverStatus}
    <div class="server-info">
        <img
            class="server-info-icon"
            src="/logo.png"
            alt="MangoMC Logo"
        /><div class="server-info-content">
            <span class="server-info_top-bar"
                ><span class="server-info_name">Loading server info</span><noscript><span class="server-info_status">(Enable JavaScript!)</span></noscript></span
            >
        </div>
    </div>
{/if}
