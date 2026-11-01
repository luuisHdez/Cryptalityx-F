
import { Outlet } from "react-router-dom";
import Header from "../mainComponents/Header";
const Home = () => {


    return (
      <div>
        <Header />
        <main className="ml-0 md:ml-[55px] transition-all duration-300">
  <Outlet />
</main>
      </div>
    );
  }
  
  export default Home;
  