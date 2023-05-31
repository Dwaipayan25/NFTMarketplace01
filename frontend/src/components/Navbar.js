import {Link} from 'react-router-dom'
import {Navbar,Nav,Button,Container,Stack} from 'react-bootstrap'
import market from "./sm.png"

const Navigation =({web3Handler,account})=>{
    return(
        <Navbar expand="lg" variant="dark" bg="secondary">
            <Container>
                <Navbar.Brand href="">
                    <img src={market} alt="logo" width="30" height="30" className="d-inline-block align-top"/>
                    &nbsp;NFT Marketplace
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className='me-auto'>
                        <Nav.Link   as={Link} to="/" >Home</Nav.Link>
                        <Nav.Link   as={Link} to="/create" >Create</Nav.Link>
                        <Nav.Link   as={Link} to="/my-listed-items" >My NFTs</Nav.Link>
                        <Nav.Link   as={Link} to="/my-purchases" >My Purchases</Nav.Link>
                    </Nav>
                    <Nav>
                        {account ? (
                            <Nav.Link
                                href={`https://etherscan.io/address/${account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='button nav-button btn-sm mx-4'>
                                    <Button variant="outline-light">
                                        {account.slice(0,6)}...{account.slice(-4)}
                                    </Button>
                                </Nav.Link>
                        ) : (
                            <Button variant="outline-light" onClick={web3Handler}>Connect Wallet</Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default Navigation;