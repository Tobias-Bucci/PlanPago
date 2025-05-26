export default function Impressum() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
            <div className="glass-card w-full max-w-2xl p-8 animate-pop">
                <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Legal Notice & Contact</h1>
                <div className="prose prose-invert max-w-none text-white/90 space-y-4">
                    <p><strong>Website Operator (Private Individual):</strong></p>
                    <p>
                        Tobias Bucci<br />
                        Mühlenweg 51<br />
                        39030 St. Sigmund, Municipality of Kiens<br />
                        South Tyrol (BZ), Italy<br />
                        Email: <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>
                    </p>
                    <p>
                        This privately maintained website is intended exclusively for personal contract management purposes.
                        It does not pursue any commercial objectives and is not a registered business activity under Italian law.
                    </p>
                    <p>
                        For any legal or support inquiries, please contact us via email.
                    </p>
                    <p className="text-xs text-white/60">
                        Disclaimer: Despite careful content control, we assume no liability for the content of external links.
                        The responsibility for the content of linked pages lies solely with their respective operators.
                    </p>
                </div>
            </div>
        </div>
    );
}
