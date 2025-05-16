
import { Outlet } from "react-router-dom";
import Header from "../mainComponents/Header";
const Home = () => {


    return (
      <div>
        <Header />
        <main className="pl-10 lg:pl-[60px] xl:pl-[50px] transition-all duration-300">
  <Outlet />
</main>
      </div>
    );
  }
  
  export default Home;
  