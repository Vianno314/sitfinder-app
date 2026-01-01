import React from 'react';

// Remplace ce lien par le TIEN que tu as copié sur Stripe 👇
const STRIPE_LINK = "https://buy.stripe.com/https://buy.stripe.com/test_8x2dRa29w7tj03KdAUbEA00"; 

export default function Premium() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Trouvez la perle rare <span className="text-satel_red">dès aujourd'hui</span>
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Rejoignez les parents sereins. Accédez aux profils complets et contactez les sitters en illimité.
        </p>
      </div>

      {/* Carte de prix */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm w-full border border-gray-100">
        <div className="px-6 py-8 bg-satel_orange sm:p-10 sm:pb-6">
          <div className="flex justify-center">
            <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-white text-satel_orange">
              Offre de Lancement
            </span>
          </div>
          <div className="mt-4 flex justify-center text-6xl font-extrabold text-white">
            9.99€
            <span className="ml-1 text-2xl font-medium text-white/80 self-end mb-2">/mois</span>
          </div>
        </div>
        
        <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Accès illimité aux Sitters</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Messagerie directe sécurisée</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="ml-3 text-base text-gray-700">Badge "Parent Vérifié"</p>
            </li>
          </ul>

          <div className="mt-8">
            <a
              href={STRIPE_LINK}
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center rounded-lg border border-transparent bg-satel_red px-6 py-4 text-xl font-medium text-white hover:bg-red-700 transition-colors shadow-lg"
            >
              Je m'abonne maintenant
            </a>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Paiement sécurisé par Stripe. Annulable à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
