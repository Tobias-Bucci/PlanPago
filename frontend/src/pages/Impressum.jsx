export default function Impressum() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
            <div className="glass-card w-full max-w-2xl p-8 animate-pop">
                <h1 className="text-3xl font-bold mb-8 text-center text-white drop-shadow">Imprint & Contact</h1>
                <div className="prose prose-invert max-w-none text-white/90 space-y-4">
                    <p><strong>Website Operator:</strong></p>
                    <p>
                        Tobias Bucci<br />
                        Mühlenweg 51<br />
                        39030 St. Sigmund, Municipality of Kiens<br />
                        South Tyrol (BZ), Italy<br />
                        Email: <a href="mailto:planpago.contact@gmail.com" className="underline">planpago.contact@gmail.com</a>
                    </p>
                    <p>
                        This website is privately operated and intended solely for personal contract management.
                        For support or legal inquiries, please contact us by email.
                    </p>
                    <p>
                        <strong>Content responsibility under § 55 (2) of the German Interstate Broadcasting Treaty (RStV):</strong><br />
                        Tobias Bucci, Mühlenweg 51, 39030 St. Sigmund, Municipality of Kiens, South Tyrol (BZ), Italy
                    </p>
                    <p className="text-xs text-white/60">
                        Disclaimer: Despite careful review, we accept no liability for the content of external links.
                        The content of linked websites is the sole responsibility of their respective operators.
                    </p>
                </div>
            </div>
        </div>
    );
}