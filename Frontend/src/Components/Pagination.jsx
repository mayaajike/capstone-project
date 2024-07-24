import React from 'react'
import '../CSS/Pagination.css'

export default function Pagination({ postsPerPage, totalPosts, paginate, currentPage, setCurrentPage }) {
    const pageNumbers = [];

    for (let i = 1; i <= Math.ceil(totalPosts / postsPerPage); i++) {
        pageNumbers.push(i)
    }

    const toPreviousPage = () => {
        paginate(currentPage - 1)
        setCurrentPage(currentPage - 1)
    }

    const toNextPage = () => {
        paginate(currentPage + 1)
        setCurrentPage(currentPage + 1)
    }

    return (
        <div className='pagination'>
            <button onClick={() => toPreviousPage()} disabled={currentPage === 1}> &laquo; Previous </button>
            {pageNumbers.map((number) => {
                <button key={number} onClick={() => paginate(number)} className={currentPage === number ? 'active' : ''}>
                    {number}
                </button>
            })}
            <button onClick={() => toNextPage()} disabled={currentPage === pageNumbers.length}>
                Next &raquo;
            </button>

        </div>
    )
}
