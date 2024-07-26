import React, { useEffect, useRef } from 'react';
import '../CSS/StarCursorTrail.css';

const StarCursorTrail = () => {
    const trailRef = useRef([]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            trailRef.current.forEach((star, index) => {
                if (star) {
                    const delay = index * 10;
                    setTimeout(() => {
                        star.style.left = `${e.pageX}px`;
                        star.style.top = `${e.pageY}px`;
                    }, delay);
                }
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="star-cursor-trail">
            {Array.from({ length: 10 }).map((_, index) => (
                <div
                    key={index}
                    className="star"
                    ref={(el) => (trailRef.current[index] = el)}
                ></div>
            ))}
        </div>
    );
};

export default StarCursorTrail;
