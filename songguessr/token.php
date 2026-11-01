<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$clientId = '0ba038c2eaac4e9099d5ae21f4a3bfae';
$clientSecret = 'TUTAJ_WKLEJ_SWOJ_CLIENT_SECRET';

$ch = curl_init('https://accounts.spotify.com/api/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
