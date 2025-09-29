

const Footer = () => {
  return (
    

<footer className="rounded-lg shadow-sm bg-white/5 backdrop-blur-md m-0">
    <div className="w-full max-w-screen-xl mx-auto p-2 md:pt-5">
        <div className="sm:flex sm:items-center sm:justify-center">
            <h2 className="text-white/50 text-center text-xs md:text-base" >Hecho con 🥐 y ☕ por: <br/> Jairo Avila Maury</h2>
            {/* <a href="https://flowbite.com/" className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse">
                <img src="https://flowbite.com/docs/images/logo.svg" className="h-8" alt="Flowbite Logo" />
                <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Flowbite</span>
            </a> */}
            {/* <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
                <li>
                    <a href="#" className="hover:underline me-4 md:me-6">About</a>
                </li>
                <li>
                    <a href="#" className="hover:underline me-4 md:me-6">Privacy Policy</a>
                </li>
                <li>
                    <a href="#" className="hover:underline me-4 md:me-6">Licensing</a>
                </li>
                <li>
                    <a href="#" className="hover:underline">Contact</a>
                </li>
            </ul> */}
        </div>
        <hr className="my-2 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <span className="flex md:text-sm text-xs text-gray-500 justify-center dark:text-gray-400">© 2025 <a href="https://bonga-digital.netlify.app/" target="_blank" className="hover:underline">-BongaDigital™</a>. All Rights Reserved.</span>
    </div>
</footer>


  )
}

export default Footer
