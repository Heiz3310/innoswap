# Perl Documentation
# # 's/search/replace/g'

##################################################
#            Changes to MasterDeveloperV2             #
##################################################

# SafeTransfer simplification
perl -0777 -i -pe 's/safeT/t/g' contracts/MasterDeveloperV2.sol

# Adding public to totalAllocPoint
perl -0777 -i -pe 's/uint256 totalAllocPoint/uint256 public totalAllocPoint/g' contracts/MasterDeveloperV2.sol

# Adding virtual to innovaiPerBlock()
perl -0777 -i -pe 's/function innovaiPerBlock\(\) public view returns/function innovaiPerBlock\(\) public view virtual returns/g' contracts/MasterDeveloperV2.sol

perl -0777 -i -pe 's/\) external payable returns\(/\) external virtual payable returns\(/g' node_modules/@boringcrypto/boring-solidity/contracts/BoringBatchable.sol

# Add transfer function declaration 
perl -0777 -i -pe 's/\}/function transfer\(address to, uint256 amount\) external;\n function transferFrom\(address from, address to, uint256 amount\) external;\n\}/g' node_modules/@boringcrypto/boring-solidity/contracts/interfaces/IERC20.sol