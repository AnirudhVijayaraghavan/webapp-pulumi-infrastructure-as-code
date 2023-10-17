"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

// Create an AWS resource (S3 Bucket)
//const bucket = new aws.s3.Bucket("my-bucket");
// Export the name of the bucket
//exports.bucketName = bucket.id;


// Create a new Pulumi stack for your AWS resources.
//const stack = new pulumi.Stack();
let config = new pulumi.Config();

const cidr_block = config.require("cidr_block");
const desired_subnets = config.require("desired_subnets");
const destination_cidr_block = config.require("destination_cidr_block");
console.log(cidr_block, desired_subnets, destination_cidr_block);
// const cidr_block = pulumi.Config('cidr_block');
// const desired_subnets = pulumi.Config('desired_subnets');
// const destination_cidr_block = pulumi.Config('destination_cidr_block');

// Step 1: Create a Virtual Private Cloud (VPC).
const vpc = new aws.ec2.Vpc('myVpc', {
    cidrBlock: cidr_block,
    tags: {
        Name: 'my-vpc',
    }
});
// Step 2: Create subnets (3 public and 3 private in different AZs).

const publicSubnetIds = [];
const privateSubnetIds = [];

const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
const subnets = [];

for (let index = 0; index < availabilityZones.length * 2; index++) {
    const isPublic = index < availabilityZones.length; // First 3 are public, next 3 are private
    const azIndex = index % availabilityZones.length; // Rotate through the AZs

    const subnetName = isPublic ? `public-subnet-${availabilityZones[azIndex]}` : `private-subnet-${availabilityZones[azIndex]}`;
    const subnet = new aws.ec2.Subnet(subnetName, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: availabilityZones[azIndex],
        mapPublicIpOnLaunch: isPublic,
        tags: {
            Name: `my-subnet-${index}`,
        }
    });

    subnets.push(subnet);
}


// aws.getAvailabilityZones().then((availabilityZones) => {
//     // Calculate the number of subnets based on the number of availability zones.
//     const subnetCount = Math.min(desired_subnets, availabilityZones.names.length);

//     // Create subnets in each availability zone.
//     for (let i = 0; i < subnetCount; i++) {
//         // Create public subnet.
//         const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i}`, {
//             vpcId: vpc.id, // Replace with your VPC ID
//             cidrBlock: `10.0.${i * 2}.0/24`, // Adjust the CIDR block
//             availabilityZone: availabilityZones.names[i],
//             mapPublicIpOnLaunch: true,
//             tags: {
//                 Name: `my-public-subnet2-${i}`,
//             }
//         });

//         // Create private subnet.
//         const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i}`, {
//             vpcId: vpc.id, // Replace with your VPC ID
//             cidrBlock: `10.0.${i * 2 + 1}.0/24`, // Adjust the CIDR block
//             availabilityZone: availabilityZones.names[i],
//             tags: {
//                 Name: `my-private-subnet2-${i}`,
//             }
//         });

//         // Optionally, you can store subnet IDs in an array for later use.
//         publicSubnetIds.push(publicSubnet.id);
//         privateSubnetIds.push(privateSubnet.id);
//     }
// });
// aws.getAvailabilityZones().then((availabilityZones) => {
//     availabilityZones.names.slice(0, desired_subnets).forEach((az, i) => {
//         // Create public subnet
//         const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i}`, {
//             vpcId: vpc.id, // Ensure vpc.id is defined
//             cidrBlock: `10.0.${i * 2}.0/24`, // Adjust CIDR block
//             availabilityZone: az,
//             mapPublicIpOnLaunch: true,
//             tags: {
//                 Name: `my-public-subnet2-${i}`,
//             }
//         });

//         publicSubnetIds.push(publicSubnet.id);

//         // Create private subnet
//         const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i}`, {
//             vpcId: vpc.id, // Ensure vpc.id is defined
//             cidrBlock: `10.0.${i * 2 + 1}.0/24`, // Adjust CIDR block
//             availabilityZone: az,
//             tags: {
//                 Name: `my-private-subnet2-${i}`,
//             }
//         });

//         privateSubnetIds.push(privateSubnet.id);
//     });
// });
// const subnets = [];
// const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
// const subnetCidrBlocks = [
//     '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24',
//     '10.0.4.0/24', '10.0.5.0/24', '10.0.6.0/24'
// ];
// for (let index = 0; index < 6; index++) {
//     const isPublic = index < 3; // First 3 are public, next 3 are private
//     const azIndex = index % 3; // Rotate through the AZs

//     const subnetName = isPublic ? `public-subnet-${availabilityZones[azIndex]}` : `private-subnet-${availabilityZones[azIndex]}`;
//     const subnet = new aws.ec2.Subnet(subnetName, {
//         vpcId: vpc.id,
//         cidrBlock: subnetCidrBlocks[index],
//         availabilityZone: availabilityZones[azIndex],
//         mapPublicIpOnLaunch: isPublic,
//         tags: {
//             Name: `my-subnet-${index}`,
//         }
//     });

//     subnets.push(subnet);
// }

// Step 3: Create an Internet Gateway and attach it to the VPC.
const internetGateway = new aws.ec2.InternetGateway('myInternetGateway', {
    vpcId: vpc.id,
    tags: {
        Name: 'my-internet-gateway',
    }
});

// Step 4: Create a public route table and attach public subnets to it.
const publicRouteTable = new aws.ec2.RouteTable('publicRouteTable', {
    vpcId: vpc.id,
    tags: {
        Name: 'my-public-route-table',
    }
});

subnets.slice(0, subnets.length / 2).forEach((subnet, index) => {
    const routeName = `public-route-${index}`;

    const routeAssocName = `public-route-table-assoc-${index}`;
    new aws.ec2.Route(routeName, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: destination_cidr_block,
        gatewayId: internetGateway.id,
    });
    new aws.ec2.RouteTableAssociation(routeAssocName, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
    });

    // new aws.ec2.Route('publicRouteToInternet', {
    //     routeTableId: publicRouteTable.id,
    //     destinationCidrBlock: '0.0.0.0/0',
    //     gatewayId: internetGateway.id,
    // });


});


// Step 5: Create a private route table and attach private subnets to it.
const privateRouteTable = new aws.ec2.RouteTable('privateRouteTable', {
    vpcId: vpc.id,
    tags: {
        Name: 'my-private-route-table',
    }
});

subnets.slice(subnets.length / 2).forEach((subnet, index) => {
    const routeAssocName = `private-route-table-assoc-${index}`;

    new aws.ec2.RouteTableAssociation(routeAssocName, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
    });
});

// Step 6: Create a public route in the public route table.
new aws.ec2.Route('publicRouteToInternet', {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: destination_cidr_block,
    gatewayId: internetGateway.id,
});

// Export the VPC ID for other Pulumi stacks to reference.
exports.vpcId = vpc.id;



