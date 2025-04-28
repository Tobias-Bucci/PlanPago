// Glass wrapper for every chart / block
export default function Card({ title, children, className = "" }) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        {title && (
          <h2 className="text-xl font-medium mb-4 text-white/90">{title}</h2>
        )}
        {children}
      </div>
    );
  }
  